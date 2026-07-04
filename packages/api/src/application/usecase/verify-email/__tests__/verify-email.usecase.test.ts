import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerifyEmailUseCase } from "../verify-email.usecase";
import { VerifyEmailInput } from "../verify-email.input";
import { EmailVerificationToken } from "../../../../domain/entities/EmailVerificationToken";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IEmailVerificationTokenRepository } from "../../../../domain/repositories/IEmailVerificationTokenRepository";

const VALID_TOKEN = "a".repeat(64);
const FUTURE_DATE = new Date(Date.now() + 60_000);
const PAST_DATE = new Date(Date.now() - 60_000);

describe("VerifyEmailUseCase", () => {
  let userRepository: IUserRepository;
  let tokenRepository: IEmailVerificationTokenRepository;
  let useCase: VerifyEmailUseCase;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(), findByEmail: vi.fn(), findRoleByPublicId: vi.fn(), markVerified: vi.fn(), markSuspended: vi.fn(), unsuspend: vi.fn(),
      findByPublicId: vi.fn(), updateProfile: vi.fn(), findById: vi.fn(), updatePassword: vi.fn(),
      findByIds: vi.fn(), deleteById: vi.fn(),
    };
    tokenRepository = { save: vi.fn(), findByValue: vi.fn(), markAsUsed: vi.fn() };
    useCase = new VerifyEmailUseCase(userRepository, tokenRepository);
  });

  describe("when token is valid", () => {
    it("marks the user as verified and consumes the token", async () => {
      // Given un token valido en la DB
      const token = EmailVerificationToken.reconstruct(7, 42, VALID_TOKEN, FUTURE_DATE, null, new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(token);

      // When ejecuto el caso de uso
      await useCase.execute(new VerifyEmailInput(VALID_TOKEN));

      // Then se marca al usuario como verificado y el token como usado
      expect(userRepository.markVerified).toHaveBeenCalledWith(42);
      expect(tokenRepository.markAsUsed).toHaveBeenCalledWith(7, expect.any(Date));
    });
  });

  describe("when token does not exist", () => {
    it("throws InvalidVerificationTokenError with reason not_found", async () => {
      // Given el repo no encuentra el token
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(null);

      // When intento verificar
      const accion = () => useCase.execute(new VerifyEmailInput(VALID_TOKEN));

      // Then tira error y NO se marca al usuario
      await expect(accion).rejects.toMatchObject({
        name: "InvalidVerificationTokenError",
        reason: "not_found",
      });
      expect(userRepository.markVerified).not.toHaveBeenCalled();
    });
  });

  describe("when token is already used", () => {
    it("throws InvalidVerificationTokenError with reason already_used", async () => {
      // Given un token con usedAt seteado
      const token = EmailVerificationToken.reconstruct(7, 42, VALID_TOKEN, FUTURE_DATE, new Date(), new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(token);

      // When intento verificar
      const accion = () => useCase.execute(new VerifyEmailInput(VALID_TOKEN));

      // Then tira error con razon already_used
      await expect(accion).rejects.toMatchObject({
        name: "InvalidVerificationTokenError",
        reason: "already_used",
      });
      expect(userRepository.markVerified).not.toHaveBeenCalled();
    });
  });

  describe("when token is expired", () => {
    it("throws InvalidVerificationTokenError with reason expired", async () => {
      // Given un token con expiracion en el pasado
      const token = EmailVerificationToken.reconstruct(7, 42, VALID_TOKEN, PAST_DATE, null, new Date());
      vi.mocked(tokenRepository.findByValue).mockResolvedValue(token);

      // When intento verificar
      const accion = () => useCase.execute(new VerifyEmailInput(VALID_TOKEN));

      // Then tira error con razon expired
      await expect(accion).rejects.toMatchObject({
        name: "InvalidVerificationTokenError",
        reason: "expired",
      });
      expect(userRepository.markVerified).not.toHaveBeenCalled();
    });
  });
});
