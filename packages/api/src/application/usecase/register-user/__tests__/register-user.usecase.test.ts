import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterUserUseCase } from "../register-user.usecase";
import { RegisterUserInput } from "../register-user.input";
import { User } from "../../../../domain/entities/User";
import { EmailAlreadyExistsError } from "../../../../domain/errors/EmailAlreadyExistsError";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IPasswordHasher } from "../../../../domain/services/IPasswordHasher";
import type { IEmailVerificationTokenRepository } from "../../../../domain/repositories/IEmailVerificationTokenRepository";
import type { ITokenGenerator } from "../../../../domain/services/ITokenGenerator";
import type { IEmailService } from "../../../../domain/services/IEmailService";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";
const VALID_TOKEN = "a".repeat(64);

const persistedUser = (email: string, username: string): User =>
  User.reconstruct(42, "uuid-fake", email, username, VALID_BCRYPT_HASH, false, new Date(), null, null, null);

describe("RegisterUserUseCase", () => {
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let tokenRepository: IEmailVerificationTokenRepository;
  let tokenGenerator: ITokenGenerator;
  let emailService: IEmailService;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(), findByEmail: vi.fn(), markVerified: vi.fn(),
      findByPublicId: vi.fn(), updateProfile: vi.fn(), findById: vi.fn(),
      updatePassword: vi.fn(), findByIds: vi.fn(), deleteById: vi.fn(),
    };
    passwordHasher = { hash: vi.fn(), verify: vi.fn() };
    tokenRepository = { save: vi.fn(), findByValue: vi.fn(), markAsUsed: vi.fn() };
    tokenGenerator = { generate: vi.fn() };
    emailService = { sendVerificationLink: vi.fn(), sendPasswordResetLink: vi.fn() };
    useCase = new RegisterUserUseCase(userRepository, passwordHasher, tokenRepository, tokenGenerator, emailService);
  });

  describe("when email is available", () => {
    it("creates the user, sends the verification link and returns the public id", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(persistedUser("juan@example.com", "juancho"));
      vi.mocked(tokenGenerator.generate).mockReturnValue(VALID_TOKEN);

      const output = await useCase.execute(new RegisterUserInput("juan@example.com", "juancho", "miPass123"));

      expect(userRepository.save).toHaveBeenCalledOnce();
      expect(tokenRepository.save).toHaveBeenCalledOnce();
      expect(emailService.sendVerificationLink).toHaveBeenCalledWith("juan@example.com", VALID_TOKEN);
      expect(userRepository.deleteById).not.toHaveBeenCalled();
      expect(output.userId).toBe("uuid-fake");
    });
  });

  describe("when email is already registered", () => {
    it("throws EmailAlreadyExistsError without saving or sending", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({} as never);

      const accion = () =>
        useCase.execute(new RegisterUserInput("juan@example.com", "juancho", "miPass123"));

      await expect(accion).rejects.toThrow(EmailAlreadyExistsError);
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(emailService.sendVerificationLink).not.toHaveBeenCalled();
    });
  });

  describe("when sending the verification email fails", () => {
    it("rolls back the created user and propagates the error", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(persistedUser("juan@example.com", "juancho"));
      vi.mocked(tokenGenerator.generate).mockReturnValue(VALID_TOKEN);
      vi.mocked(emailService.sendVerificationLink).mockRejectedValue(new Error("smtp down"));

      const accion = () =>
        useCase.execute(new RegisterUserInput("juan@example.com", "juancho", "miPass123"));

      await expect(accion).rejects.toThrow("smtp down");
      expect(userRepository.deleteById).toHaveBeenCalledWith(42);
    });
  });
});
