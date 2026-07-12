import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginWithGoogleUseCase } from "../login-with-google.usecase";
import { LoginWithGoogleInput } from "../login-with-google.input";
import { User } from "../../../../domain/entities/User";
import { GoogleEmailNotVerifiedError } from "../../../../domain/errors/GoogleEmailNotVerifiedError";
import { UserSuspendedError } from "../../../../domain/errors/UserSuspendedError";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IGoogleAccountLinker } from "../../../../domain/repositories/IGoogleAccountLinker";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";
import type { IGoogleAuthenticator, GoogleIdentity } from "../../../../domain/services/IGoogleAuthenticator";
import type { ITokenSigner } from "../../../../domain/services/ITokenSigner";
import type { ITokenGenerator } from "../../../../domain/services/ITokenGenerator";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";
const REFRESH_TOKEN_VALUE = "a".repeat(64);
const ACCESS_JWT = "header.payload.signature";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_CODE = "auth-code-from-google";

const identity = (overrides: Partial<GoogleIdentity> = {}): GoogleIdentity => ({
  email: "juan@example.com",
  emailVerified: true,
  googleId: "google-sub-123",
  name: "Juan",
  picture: "https://pic/juan.png",
  ...overrides,
});

const persistedGoogleUser = (): User =>
  User.reconstruct(99, "uuid-new", "juan@example.com", "juan", null, true, new Date(), null, null, "https://pic/juan.png", false, 0, "google-sub-123");

const existingUser = (overrides: Partial<{ isSuspended: boolean; googleId: string | null }> = {}): User =>
  User.reconstruct(
    42, "uuid-existing", "juan@example.com", "juan", VALID_BCRYPT_HASH, true, new Date(), null, null, null,
    overrides.isSuspended ?? false, 0, overrides.googleId ?? null,
  );

describe("LoginWithGoogleUseCase", () => {
  let googleAuthenticator: IGoogleAuthenticator;
  let userRepository: IUserRepository;
  let googleAccountLinker: IGoogleAccountLinker;
  let refreshTokenRepository: IRefreshTokenRepository;
  let tokenSigner: ITokenSigner;
  let tokenGenerator: ITokenGenerator;
  let useCase: LoginWithGoogleUseCase;

  beforeEach(() => {
    googleAuthenticator = { authenticate: vi.fn().mockResolvedValue(identity()) };
    userRepository = { findByEmail: vi.fn(), save: vi.fn() } as unknown as IUserRepository;
    googleAccountLinker = { linkGoogleId: vi.fn() };
    refreshTokenRepository = { save: vi.fn(), findByValue: vi.fn(), revoke: vi.fn(), revokeAllByUser: vi.fn() };
    tokenSigner = { sign: vi.fn().mockReturnValue(ACCESS_JWT), verify: vi.fn() };
    tokenGenerator = { generate: vi.fn().mockReturnValue(REFRESH_TOKEN_VALUE) };
    useCase = new LoginWithGoogleUseCase(
      googleAuthenticator,
      userRepository,
      googleAccountLinker,
      refreshTokenRepository,
      tokenSigner,
      tokenGenerator,
      SEVEN_DAYS_MS,
    );
  });

  describe("when the email has no account yet", () => {
    beforeEach(() => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.save).mockResolvedValue(persistedGoogleUser());
    });

    it("creates a verified passwordless Google user with the derived username", async () => {
      // When inicio sesion con Google por primera vez
      await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then se persiste un usuario nuevo con los datos de Google y sin password
      const savedUser = vi.mocked(userRepository.save).mock.calls[0]![0];
      expect(savedUser.email).toBe("juan@example.com");
      expect(savedUser.username).toBe("juan");
      expect(savedUser.googleId).toBe("google-sub-123");
      expect(savedUser.passwordHash).toBeNull();
      expect(savedUser.isVerified).toBe(true);
    });

    it("returns access and refresh tokens and persists the refresh token", async () => {
      // When inicio sesion con Google por primera vez
      const output = await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then devuelve ambos tokens y persiste el refresh con expiracion futura
      expect(output.accessToken).toBe(ACCESS_JWT);
      expect(output.refreshToken).toBe(REFRESH_TOKEN_VALUE);
      const savedToken = vi.mocked(refreshTokenRepository.save).mock.calls[0]![0];
      expect(savedToken.userId).toBe(99);
      expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("does not link an account when it just created one", async () => {
      // When creo la cuenta desde Google
      await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then no se intenta vincular (no habia cuenta previa)
      expect(googleAccountLinker.linkGoogleId).not.toHaveBeenCalled();
    });
  });

  describe("when the email already has a password account", () => {
    it("links the Google id to the existing account and logs in without creating a new user", async () => {
      // Given una cuenta registrada con password y sin Google vinculado
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser({ googleId: null }));

      // When entro con Google usando ese mismo email
      const output = await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then se vincula el google_id a esa cuenta y NO se crea una nueva
      expect(googleAccountLinker.linkGoogleId).toHaveBeenCalledWith(42, "google-sub-123");
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(output.accessToken).toBe(ACCESS_JWT);
    });

    it("signs the access token with the existing user public id and verified flag", async () => {
      // Given una cuenta existente
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser({ googleId: null }));

      // When entro con Google
      await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then el JWT se firma con el payload de esa cuenta
      expect(tokenSigner.sign).toHaveBeenCalledWith({
        sub: "uuid-existing",
        email: "juan@example.com",
        isVerified: true,
      });
    });
  });

  describe("when the account already had Google linked", () => {
    it("does not link again", async () => {
      // Given una cuenta que ya tenia el google_id vinculado
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser({ googleId: "google-sub-123" }));

      // When vuelvo a entrar con Google
      await useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then no se re-vincula
      expect(googleAccountLinker.linkGoogleId).not.toHaveBeenCalled();
    });
  });

  describe("when the account is suspended", () => {
    it("throws UserSuspendedError without issuing tokens", async () => {
      // Given una cuenta suspendida por moderacion
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser({ isSuspended: true }));

      // When intento entrar con Google
      const accion = () => useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then tira UserSuspendedError y no firma ni persiste tokens
      await expect(accion).rejects.toThrow(UserSuspendedError);
      expect(tokenSigner.sign).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("when Google reports the email as not verified", () => {
    it("throws GoogleEmailNotVerifiedError without touching the repositories", async () => {
      // Given un identity de Google con email sin verificar
      vi.mocked(googleAuthenticator.authenticate).mockResolvedValue(identity({ emailVerified: false }));

      // When intento entrar
      const accion = () => useCase.execute(new LoginWithGoogleInput(AUTH_CODE));

      // Then tira GoogleEmailNotVerifiedError y ni siquiera busca el usuario
      await expect(accion).rejects.toThrow(GoogleEmailNotVerifiedError);
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });
});
