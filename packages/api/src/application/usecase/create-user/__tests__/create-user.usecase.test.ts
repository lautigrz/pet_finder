import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "../create-user.usecase";
import { CreateUserInput } from "../create-user.input";
import { User } from "../../../../domain/entities/User";
import { EmailAlreadyExistsError } from "../../../../domain/errors/EmailAlreadyExistsError";
import { InvalidEmailError } from "../../../../domain/errors/InvalidEmailError";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IPasswordHasher } from "../../../../domain/services/IPasswordHasher";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const persistedUser = (email: string): User =>
  User.reconstruct(42, "uuid-fake", email, VALID_BCRYPT_HASH, false, new Date());

describe("CreateUserUseCase", () => {
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = { save: vi.fn(), findByEmail: vi.fn(), markVerified: vi.fn() };
    passwordHasher = { hash: vi.fn(), verify: vi.fn() };
    useCase = new CreateUserUseCase(userRepository, passwordHasher);
  });

  describe("when email is available", () => {
    it("creates a user with a hashed password and returns the persisted ids", async () => {
      // Given un repo sin el email registrado y un hasher que devuelve un bcrypt hash valido
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(persistedUser("juan@example.com"));

      // When ejecuto el caso de uso
      const output = await useCase.execute(
        new CreateUserInput("juan@example.com", "miPass123"),
      );

      // Then se hashea el password, se persiste el usuario y devuelve los ids + email
      expect(passwordHasher.hash).toHaveBeenCalledWith("miPass123");
      expect(userRepository.save).toHaveBeenCalledOnce();
      expect(output.userId).toBe("uuid-fake");
      expect(output.internalUserId).toBe(42);
      expect(output.email).toBe("juan@example.com");
    });

    it("normalizes the email (trim + lowercase) before saving", async () => {
      // Given un email con espacios y mayusculas
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(persistedUser("juan@example.com"));

      // When ejecuto el caso de uso con email sucio
      await useCase.execute(new CreateUserInput("  JUAN@Example.com  ", "miPass123"));

      // Then el repo busca y guarda con el email normalizado
      expect(userRepository.findByEmail).toHaveBeenCalledWith("juan@example.com");
      const savedUser = vi.mocked(userRepository.save).mock.calls[0][0];
      expect(savedUser.email).toBe("juan@example.com");
    });
  });

  describe("when email is already registered", () => {
    it("throws EmailAlreadyExistsError without hashing or saving", async () => {
      // Given un repo que ya tiene el email registrado
      vi.mocked(userRepository.findByEmail).mockResolvedValue({} as never);

      // When intento crear el usuario
      const accion = () =>
        useCase.execute(new CreateUserInput("juan@example.com", "miPass123"));

      // Then tira EmailAlreadyExistsError y NO se hashea ni se guarda
      await expect(accion).rejects.toThrow(EmailAlreadyExistsError);
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("when email has invalid format", () => {
    it("throws InvalidEmailError without saving", async () => {
      // Given un email invalido (sin punto en el dominio)
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);

      // When intento crear el usuario
      const accion = () =>
        useCase.execute(new CreateUserInput("no-es-un-email", "miPass123"));

      // Then tira InvalidEmailError y NO se guarda
      await expect(accion).rejects.toThrow(InvalidEmailError);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
