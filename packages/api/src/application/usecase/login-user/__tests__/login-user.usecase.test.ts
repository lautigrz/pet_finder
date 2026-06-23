import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUserUseCase } from "../login-user.usecase";
import { LoginUserInput } from "../login-user.input";
import { User } from "../../../../domain/entities/User";
import { InvalidCredentialsError } from "../../../../domain/errors/InvalidCredentialsError";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";
import type { IPasswordHasher } from "../../../../domain/services/IPasswordHasher";
import type { ITokenSigner } from "../../../../domain/services/ITokenSigner";
import type { ITokenGenerator } from "../../../../domain/services/ITokenGenerator";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";
const REFRESH_TOKEN_VALUE = "a".repeat(64);
const ACCESS_JWT = "header.payload.signature";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const existingUser = (overrides: Partial<{ isVerified: boolean }> = {}): User =>
  User.reconstruct(
    42,
    "uuid-fake",
    "juan@example.com",
    "juan",
    VALID_BCRYPT_HASH,
    overrides.isVerified ?? true,
    new Date(),
    null,
    null,
    null,
  );

describe("LoginUserUseCase", () => {
  let userRepository: IUserRepository;
  let refreshTokenRepository: IRefreshTokenRepository;
  let passwordHasher: IPasswordHasher;
  let tokenSigner: ITokenSigner;
  let tokenGenerator: ITokenGenerator;
  let useCase: LoginUserUseCase;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(), findByEmail: vi.fn(), markVerified: vi.fn(),
      findByPublicId: vi.fn(), updateProfile: vi.fn(), findById: vi.fn(), updatePassword: vi.fn(),
      findByIds: vi.fn(), deleteById: vi.fn(),
    };
    refreshTokenRepository = { save: vi.fn(), findByValue: vi.fn(), revoke: vi.fn(), revokeAllByUser: vi.fn() };
    passwordHasher = { hash: vi.fn(), verify: vi.fn() };
    tokenSigner = { sign: vi.fn(), verify: vi.fn() };
    tokenGenerator = { generate: vi.fn() };
    useCase = new LoginUserUseCase(
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenSigner,
      tokenGenerator,
      SEVEN_DAYS_MS,
    );
  });

  describe("when credentials are valid", () => {
    it("returns access and refresh tokens, and persists the refresh token", async () => {
      // Given un usuario existente con password que matchea
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser());
      vi.mocked(passwordHasher.verify).mockResolvedValue(true);
      vi.mocked(tokenSigner.sign).mockReturnValue(ACCESS_JWT);
      vi.mocked(tokenGenerator.generate).mockReturnValue(REFRESH_TOKEN_VALUE);

      // When ejecuto el caso de uso
      const output = await useCase.execute(
        new LoginUserInput("juan@example.com", "miPass123"),
      );

      // Then devuelve ambos tokens y el refresh se persiste con expiracion futura
      expect(output.accessToken).toBe(ACCESS_JWT);
      expect(output.refreshToken).toBe(REFRESH_TOKEN_VALUE);
      expect(refreshTokenRepository.save).toHaveBeenCalledOnce();
      const savedToken = vi.mocked(refreshTokenRepository.save).mock.calls[0]![0];
      expect(savedToken.userId).toBe(42);
      expect(savedToken.value).toBe(REFRESH_TOKEN_VALUE);
      expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("signs the access token with the user public id, email and verified flag", async () => {
      // Given un usuario verificado
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser({ isVerified: true }));
      vi.mocked(passwordHasher.verify).mockResolvedValue(true);
      vi.mocked(tokenSigner.sign).mockReturnValue(ACCESS_JWT);
      vi.mocked(tokenGenerator.generate).mockReturnValue(REFRESH_TOKEN_VALUE);

      // When ejecuto el caso de uso
      await useCase.execute(new LoginUserInput("juan@example.com", "miPass123"));

      // Then el JWT se firma con el payload correcto
      expect(tokenSigner.sign).toHaveBeenCalledWith({
        sub: "uuid-fake",
        email: "juan@example.com",
        isVerified: true,
      });
    });

    it("normalizes the email before searching the user", async () => {
      // Given un usuario existente
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser());
      vi.mocked(passwordHasher.verify).mockResolvedValue(true);
      vi.mocked(tokenSigner.sign).mockReturnValue(ACCESS_JWT);
      vi.mocked(tokenGenerator.generate).mockReturnValue(REFRESH_TOKEN_VALUE);

      // When ejecuto con email sucio
      await useCase.execute(new LoginUserInput("  JUAN@Example.com  ", "miPass123"));

      // Then el repo busca con el email normalizado
      expect(userRepository.findByEmail).toHaveBeenCalledWith("juan@example.com");
    });
  });

  describe("when the email does not exist", () => {
    it("throws InvalidCredentialsError without verifying password", async () => {
      // Given un repo que no encuentra el usuario
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      // When intento loguear
      const accion = () =>
        useCase.execute(new LoginUserInput("juan@example.com", "miPass123"));

      // Then tira InvalidCredentialsError y NO se intenta validar password
      await expect(accion).rejects.toThrow(InvalidCredentialsError);
      expect(passwordHasher.verify).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("when the password does not match", () => {
    it("throws InvalidCredentialsError without issuing tokens", async () => {
      // Given un usuario existente pero password incorrecto
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser());
      vi.mocked(passwordHasher.verify).mockResolvedValue(false);

      // When intento loguear con password equivocado
      const accion = () =>
        useCase.execute(new LoginUserInput("juan@example.com", "passEquivocada"));

      // Then tira InvalidCredentialsError y NO se firman ni persisten tokens
      await expect(accion).rejects.toThrow(InvalidCredentialsError);
      expect(tokenSigner.sign).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });
});
