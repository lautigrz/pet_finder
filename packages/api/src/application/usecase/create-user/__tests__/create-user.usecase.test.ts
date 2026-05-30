import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "../create-user.usecase";
import { CreateUserInput } from "../create-user.input";
import { User } from "../../../../domain/entities/User";
import { EmailAlreadyExistsError } from "../../../../domain/errors/EmailAlreadyExistsError";
import { InvalidEmailError } from "../../../../domain/errors/InvalidEmailError";
import { InvalidUsernameError } from "../../../../domain/errors/InvalidUsernameError";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IPasswordHasher } from "../../../../domain/services/IPasswordHasher";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const persistedUser = (email: string, username: string): User =>
  User.reconstruct(42, "uuid-fake", email, username, VALID_BCRYPT_HASH, false, new Date(), null, null, null);

describe("CreateUserUseCase", () => {
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = {
      save: vi.fn(), findByEmail: vi.fn(), markVerified: vi.fn(),
      findByPublicId: vi.fn(), updateProfile: vi.fn(), findById: vi.fn(),
    };
    passwordHasher = { hash: vi.fn(), verify: vi.fn() };
    useCase = new CreateUserUseCase(userRepository, passwordHasher);
  });

  describe("when email is available", () => {
    it("creates a user with a hashed password and returns the persisted ids", async () => {
      // Given un repo sin el email registrado y un hasher que devuelve un bcrypt hash valido
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(
        persistedUser("juan@example.com", "juancho"),
      );

      // When ejecuto el caso de uso
      const output = await useCase.execute(
        new CreateUserInput("juan@example.com", "juancho", "miPass123"),
      );

      // Then se hashea el password, se persiste el usuario y devuelve los ids + email
      expect(passwordHasher.hash).toHaveBeenCalledWith("miPass123");
      expect(userRepository.save).toHaveBeenCalledOnce();
      expect(output.userId).toBe("uuid-fake");
      expect(output.internalUserId).toBe(42);
      expect(output.email).toBe("juan@example.com");
    });

    it("normalizes the email and trims the username before saving", async () => {
      // Given un email con espacios y mayusculas, y un username con espacios
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(
        persistedUser("juan@example.com", "juancho"),
      );

      // When ejecuto con datos sucios
      await useCase.execute(
        new CreateUserInput("  JUAN@Example.com  ", "  juancho  ", "miPass123"),
      );

      // Then el repo busca el email normalizado y guarda con username sin espacios
      expect(userRepository.findByEmail).toHaveBeenCalledWith("juan@example.com");
      expect(userRepository.save).toHaveBeenCalledOnce();
      const savedUser = vi.mocked(userRepository.save).mock.calls[0]![0];
      expect(savedUser.email).toBe("juan@example.com");
      expect(savedUser.username).toBe("juancho");
    });
  });

  describe("when email is already registered", () => {
    it("throws EmailAlreadyExistsError without hashing or saving", async () => {
      // Given un repo que ya tiene el email registrado
      vi.mocked(userRepository.findByEmail).mockResolvedValue({} as never);

      // When intento crear el usuario
      const accion = () =>
        useCase.execute(new CreateUserInput("juan@example.com", "juancho", "miPass123"));

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
        useCase.execute(new CreateUserInput("no-es-un-email", "juancho", "miPass123"));

      // Then tira InvalidEmailError y NO se guarda
      await expect(accion).rejects.toThrow(InvalidEmailError);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("when username has invalid format", () => {
    it("throws InvalidUsernameError if it has invalid characters", async () => {
      // Given un username con caracteres no permitidos (ej: punto, signo +)
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);

      // When intento crear con username con caracteres inválidos
      const accion = () =>
        useCase.execute(new CreateUserInput("juan@example.com", "juan.cho+", "miPass123"));

      // Then tira InvalidUsernameError y NO se guarda
      await expect(accion).rejects.toThrow(InvalidUsernameError);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("accepts usernames with spaces and accented letters", async () => {
      // Given un username con espacios y acentos
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);
      vi.mocked(userRepository.save).mockResolvedValue(
        persistedUser("juan@example.com", "Juan García"),
      );

      // When ejecuto con username con espacios y tilde
      await useCase.execute(
        new CreateUserInput("juan@example.com", "Juan García", "miPass123"),
      );

      // Then se persiste sin tirar error
      expect(userRepository.save).toHaveBeenCalledOnce();
    });

    it("throws InvalidUsernameError if it is too short", async () => {
      // Given un username de 2 caracteres
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordHasher.hash).mockResolvedValue(VALID_BCRYPT_HASH);

      // When intento crear con username corto
      const accion = () =>
        useCase.execute(new CreateUserInput("juan@example.com", "jc", "miPass123"));

      // Then tira InvalidUsernameError
      await expect(accion).rejects.toThrow(InvalidUsernameError);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
