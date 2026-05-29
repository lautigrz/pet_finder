import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetProfileUseCase } from "../get-profile.usecase";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import { UserNotFoundError } from "../../../../domain/errors/UserNotFoundError";

describe("GetProfileUseCase", () => {
  let userRepository: IUserRepository;
  let useCase: GetProfileUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    useCase = new GetProfileUseCase(userRepository);
  });

  describe("when the user exists", () => {
    it("returns the user profile", async () => {
      // Given un usuario existente
      vi.mocked(userRepository.findByPublicId).mockResolvedValue({
        internalId: 1,
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        passwordHash: "hashed-password",
        isVerified: true,
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: null,
        createdAt: new Date(),
});

      // When ejecuto el use case
      const result = await useCase.execute("user-123");

      // Then devuelve el perfil correctamente
      expect(result).toEqual({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: undefined,
      });

      expect(userRepository.findByPublicId).toHaveBeenCalledWith(
        "user-123",
      );
    });
  });

  describe("when the user does not exist", () => {
    it("throws UserNotFoundError", async () => {
      // Given un repositorio que no encuentra el usuario
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

      // When ejecuto el use case
      const action = () => useCase.execute("missing-user");

      // Then lanza UserNotFoundError
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});