import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResetPasswordUseCase } from "../reset-password.usecase";
import { ResetPasswordInput } from "../reset-password.input";
import { PasswordResetToken } from "../../../../domain/entities/PasswordResetToken";
import { InvalidPasswordResetTokenError } from "../../../../domain/errors/InvalidPasswordResetTokenError";
import type { IPasswordResetTokenRepository } from "../../../../domain/repositories/IPasswordResetTokenRepository";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IPasswordHasher } from "../../../../domain/services/IPasswordHasher";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";

const VALID_VALUE = "a".repeat(64);
const ONE_HOUR = 60 * 60 * 1000;

describe("ResetPasswordUseCase", () => {
  let tokenRepository: IPasswordResetTokenRepository;
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let refreshTokenRepository: IRefreshTokenRepository;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    tokenRepository = { save: vi.fn(), findByValue: vi.fn(), markAsUsed: vi.fn() };
    userRepository = { updatePassword: vi.fn() } as unknown as IUserRepository;
    passwordHasher = { hash: vi.fn(), verify: vi.fn() };
    refreshTokenRepository = {
      save: vi.fn(),
      findByValue: vi.fn(),
      revoke: vi.fn(),
      revokeAllByUser: vi.fn(),
    };
    useCase = new ResetPasswordUseCase(
      tokenRepository,
      userRepository,
      passwordHasher,
      refreshTokenRepository,
    );
  });

  describe("when the token is valid", () => {
    it("hashes the new password, updates the user, marks the token used and revokes refresh tokens", async () => {
      // Given un token valido y un hash para la nueva pass
      const token = PasswordResetToken.reconstruct(1, 42, "h", new Date(Date.now() + ONE_HOUR), null, new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(token);
      vi.mocked(passwordHasher.hash).mockResolvedValue("new-hash");

      // When reseteo
      await useCase.execute(new ResetPasswordInput(VALID_VALUE, "nuevaPass123"));

      // Then hashea, actualiza la pass, marca usado y revoca los refresh del usuario
      expect(passwordHasher.hash).toHaveBeenCalledWith("nuevaPass123");
      expect(userRepository.updatePassword).toHaveBeenCalledWith(42, "new-hash");
      expect(tokenRepository.markAsUsed).toHaveBeenCalledWith(1, expect.any(Date));
      expect(refreshTokenRepository.revokeAllByUser).toHaveBeenCalledWith(42, expect.any(Date));
    });
  });

  describe("when the token is invalid", () => {
    it("throws if the token does not exist", async () => {
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(null);
      await expect(
        useCase.execute(new ResetPasswordInput("x", "nuevaPass123")),
      ).rejects.toThrow(InvalidPasswordResetTokenError);
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("throws if the token was already used", async () => {
      const used = PasswordResetToken.reconstruct(1, 42, "h", new Date(Date.now() + ONE_HOUR), new Date(), new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(used);
      await expect(
        useCase.execute(new ResetPasswordInput(VALID_VALUE, "nuevaPass123")),
      ).rejects.toThrow(InvalidPasswordResetTokenError);
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("throws if the token expired", async () => {
      const expired = PasswordResetToken.reconstruct(1, 42, "h", new Date(Date.now() - 1000), null, new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(expired);
      await expect(
        useCase.execute(new ResetPasswordInput(VALID_VALUE, "nuevaPass123")),
      ).rejects.toThrow(InvalidPasswordResetTokenError);
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});
