import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestPasswordResetUseCase } from "../request-password-reset.usecase";
import { RequestPasswordResetInput } from "../request-password-reset.input";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IPasswordResetTokenRepository } from "../../../../domain/repositories/IPasswordResetTokenRepository";
import type { ITokenGenerator } from "../../../../domain/services/ITokenGenerator";
import type { IEmailService } from "../../../../domain/services/IEmailService";
import { User } from "../../../../domain/entities/User";

const VALID_TOKEN = "a".repeat(64);
const VALID_HASH = "h".repeat(60);

const existingUser = () =>
  User.reconstruct(42, "user-abc", "juan@example.com", "juancho", VALID_HASH, true, new Date(), null, null, null);

describe("RequestPasswordResetUseCase", () => {
  let userRepository: IUserRepository;
  let tokenRepository: IPasswordResetTokenRepository;
  let tokenGenerator: ITokenGenerator;
  let emailService: IEmailService;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    userRepository = { findByEmail: vi.fn() } as unknown as IUserRepository;
    tokenRepository = { save: vi.fn(), findByValue: vi.fn(), markAsUsed: vi.fn() };
    tokenGenerator = { generate: vi.fn() };
    emailService = { sendVerificationLink: vi.fn(), sendPasswordResetLink: vi.fn(), sendMatchAlert: vi.fn() };
    useCase = new RequestPasswordResetUseCase(
      userRepository,
      tokenRepository,
      tokenGenerator,
      emailService,
    );
  });

  describe("when the user exists", () => {
    it("generates a token, persists it and sends the reset email", async () => {
      // Given un usuario existente y un token generado
      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser());
      vi.mocked(tokenGenerator.generate).mockReturnValue(VALID_TOKEN);

      // When pido el reset
      await useCase.execute(new RequestPasswordResetInput("juan@example.com"));

      // Then se persiste el token con expiracion futura y se manda el mail de reset
      expect(tokenRepository.save).toHaveBeenCalledOnce();
      const savedToken = vi.mocked(tokenRepository.save).mock.calls[0]![0];
      expect(savedToken.userId).toBe(42);
      expect(savedToken.value).toBe(VALID_TOKEN);
      expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(emailService.sendPasswordResetLink).toHaveBeenCalledWith(
        "juan@example.com",
        VALID_TOKEN,
      );
    });
  });

  describe("when the user does NOT exist", () => {
    it("does nothing (anti-enumeration): no token saved, no email sent", async () => {
      // Given que no existe el usuario
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      // When pido el reset
      await useCase.execute(new RequestPasswordResetInput("desconocido@example.com"));

      // Then no se guarda token ni se manda mail
      expect(tokenRepository.save).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });
  });
});
