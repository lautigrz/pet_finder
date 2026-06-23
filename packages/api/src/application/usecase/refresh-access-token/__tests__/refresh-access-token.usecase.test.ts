import { describe, it, expect, vi, beforeEach } from "vitest";
import { RefreshAccessTokenUseCase } from "../refresh-access-token.usecase";
import { RefreshAccessTokenInput } from "../refresh-access-token.input";
import { InvalidRefreshTokenError } from "../../../../domain/errors/InvalidRefreshTokenError";
import { RefreshToken } from "../../../../domain/entities/RefreshToken";
import { User } from "../../../../domain/entities/User";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { ITokenSigner } from "../../../../domain/services/ITokenSigner";

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 1000);

const refreshToken = (opts: { revokedAt?: Date | null; expiresAt?: Date } = {}): RefreshToken =>
  RefreshToken.reconstruct(7, 42, "hashed", opts.expiresAt ?? FUTURE, opts.revokedAt ?? null, new Date());

const buildUser = (): User =>
  ({ id: "public-uuid", email: "juan@example.com", isVerified: true }) as unknown as User;

describe("RefreshAccessTokenUseCase", () => {
  let refreshTokenRepository: IRefreshTokenRepository;
  let userRepository: IUserRepository;
  let tokenSigner: ITokenSigner;
  let useCase: RefreshAccessTokenUseCase;

  beforeEach(() => {
    refreshTokenRepository = { save: vi.fn(), findByValue: vi.fn(), revoke: vi.fn(), revokeAllByUser: vi.fn() };
    userRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      markVerified: vi.fn(),
      findByPublicId: vi.fn(),
      updateProfile: vi.fn(),
      findById: vi.fn(),
      updatePassword: vi.fn(),
      findByIds: vi.fn(),
      deleteById: vi.fn(),
    };
    tokenSigner = { sign: vi.fn(), verify: vi.fn() };
    useCase = new RefreshAccessTokenUseCase(refreshTokenRepository, userRepository, tokenSigner);
  });

  describe("when the refresh token is valid", () => {
    it("issues a new access token for the user", async () => {
      // Given un refresh token válido y su user
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(refreshToken());
      vi.mocked(userRepository.findById).mockResolvedValue(buildUser());
      vi.mocked(tokenSigner.sign).mockReturnValue("new-access-jwt");

      // When pido un access nuevo
      const output = await useCase.execute(new RefreshAccessTokenInput("a-refresh-token"));

      // Then firma con los datos del user y devuelve el access nuevo
      expect(refreshTokenRepository.findByValue).toHaveBeenCalledWith("a-refresh-token");
      expect(tokenSigner.sign).toHaveBeenCalledWith({
        sub: "public-uuid",
        email: "juan@example.com",
        isVerified: true,
      });
      expect(output.accessToken).toBe("new-access-jwt");
    });
  });

  describe("when the refresh token is revoked", () => {
    it("throws InvalidRefreshTokenError", async () => {
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(
        refreshToken({ revokedAt: new Date() }),
      );
      const accion = () => useCase.execute(new RefreshAccessTokenInput("x"));
      await expect(accion).rejects.toThrow(InvalidRefreshTokenError);
    });
  });

  describe("when the refresh token is expired", () => {
    it("throws InvalidRefreshTokenError", async () => {
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(
        refreshToken({ expiresAt: PAST }),
      );
      const accion = () => useCase.execute(new RefreshAccessTokenInput("x"));
      await expect(accion).rejects.toThrow(InvalidRefreshTokenError);
    });
  });

  describe("when the refresh token does not exist", () => {
    it("throws InvalidRefreshTokenError", async () => {
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(null);
      const accion = () => useCase.execute(new RefreshAccessTokenInput("x"));
      await expect(accion).rejects.toThrow(InvalidRefreshTokenError);
    });
  });
});
