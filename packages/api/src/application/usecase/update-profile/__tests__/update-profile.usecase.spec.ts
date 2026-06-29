import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateProfileUseCase } from "../update-profile.usecase";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import { UpdateProfileInput } from "../update-profile.input";
import { UserNotFoundError } from "../../../../domain/errors/UserNotFoundError";
import { User } from "../../../../domain/entities/User";

describe("UpdateProfileUseCase", () => {
  let userRepository: IUserRepository;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
      updateProfile: vi.fn(),
    } as unknown as IUserRepository;

    useCase = new UpdateProfileUseCase(userRepository);
  });

  describe("when the user exists", () => {
    it("updates the profile and returns the updated user", async () => {
      // Given un usuario existente
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(
        User.reconstruct(1, "user-123", "facu@test.com", "facu", "hashed-password", true, new Date(), "Facu", "P", null),
      );

      vi.mocked(userRepository.updateProfile).mockResolvedValue(
        User.reconstruct(1, "user-123", "facu@test.com", "facu_updated", "hashed-password", true, new Date(), "Facundo", "Pereira", null),
      );

      const input = new UpdateProfileInput(
        "user-123",
        "Facundo",
        "Pereira",
        "facu_updated",
        undefined,
      );

      // When ejecuto el use case
      const result = await useCase.execute(input);

      // Then actualiza el perfil y devuelve el usuario actualizado
      expect(userRepository.findByPublicId).toHaveBeenCalledWith(
        "user-123",
      );

      expect(userRepository.updateProfile).toHaveBeenCalledWith(
        "user-123",
        {
          name: "Facundo",
          lastname: "Pereira",
          username: "facu_updated",
          photoUrl: undefined,
        },
      );

      expect(result).toEqual({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: null,
      });
    });
  });

  describe("when the user does not exist", () => {
    it("throws UserNotFoundError", async () => {
      // Given un usuario inexistente
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

      const input = new UpdateProfileInput(
        "missing-user",
        "Facundo",
        "Pereira",
        "facu_updated",
        undefined,
      );

      // When ejecuto el use case
      const action = () => useCase.execute(input);

      // Then lanza UserNotFoundError
      await expect(action).rejects.toThrow(UserNotFoundError);

      expect(userRepository.updateProfile).not.toHaveBeenCalled();
    });
  });
});