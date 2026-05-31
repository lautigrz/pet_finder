import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutUserUseCase } from "../logout-user.usecase";
import { LogoutUserInput } from "../logout-user.input";
import { RefreshToken } from "../../../../domain/entities/RefreshToken";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const activeToken = (): RefreshToken =>
  RefreshToken.reconstruct(7, 42, "hashed-value", FUTURE, null, new Date());

const revokedToken = (): RefreshToken =>
  RefreshToken.reconstruct(7, 42, "hashed-value", FUTURE, new Date(), new Date());

describe("LogoutUserUseCase", () => {
  let refreshTokenRepository: IRefreshTokenRepository;
  let useCase: LogoutUserUseCase;

  beforeEach(() => {
    refreshTokenRepository = { save: vi.fn(), findByValue: vi.fn(), revoke: vi.fn() };
    useCase = new LogoutUserUseCase(refreshTokenRepository);
  });

  describe("when the refresh token exists and is active", () => {
    it("looks it up by value and revokes it", async () => {
      // Given un refresh token activo en el repo
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(activeToken());

      // When ejecuto el logout
      await useCase.execute(new LogoutUserInput("a-refresh-token"));

      // Then lo busca por su valor y lo revoca
      expect(refreshTokenRepository.findByValue).toHaveBeenCalledWith("a-refresh-token");
      expect(refreshTokenRepository.revoke).toHaveBeenCalledOnce();
    });
  });

  describe("when the refresh token does not exist", () => {
    it("does nothing (logout es idempotente)", async () => {
      // Given un repo que no encuentra el token
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(null);

      // When ejecuto el logout
      await useCase.execute(new LogoutUserInput("token-desconocido"));

      // Then no revoca nada
      expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe("when the refresh token is already revoked", () => {
    it("does not revoke it again", async () => {
      // Given un token que ya estaba revocado
      vi.mocked(refreshTokenRepository.findByValue).mockResolvedValue(revokedToken());

      // When ejecuto el logout
      await useCase.execute(new LogoutUserInput("a-refresh-token"));

      // Then no vuelve a revocar
      expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    });
  });
});
