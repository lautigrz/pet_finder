import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetProfileUseCase } from "../get-profile.usecase";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import { UserNotFoundError } from "../../../../domain/errors/UserNotFoundError";
import { User } from "../../../../domain/entities/User";

const fakeStats = {
  reportsCreated: 3,
  successfulReturns: 1,
  activeDays: 20,
  petsHelped: 0,
};

describe("GetProfileUseCase", () => {
  let userRepository: IUserRepository;
  let useCase: GetProfileUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
      findRoleByPublicId: vi.fn(),
      getProfileStatsByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    useCase = new GetProfileUseCase(userRepository);
  });

  describe("when the user exists", () => {
    it("returns the user profile with role and stats", async () => {
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(
        User.reconstruct(
          1,
          "user-123",
          "facu@test.com",
          "facu_updated",
          "hashed-password",
          true,
          new Date(),
          "Facundo",
          "Pereira",
          null,
        ),
      );

      vi.mocked(userRepository.findRoleByPublicId).mockResolvedValue("ADMIN");
      vi.mocked(userRepository.getProfileStatsByPublicId).mockResolvedValue(
        fakeStats,
      );

      const result = await useCase.execute("user-123");

      expect(result).toEqual({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: undefined,
        role: "ADMIN",
        stats: fakeStats,
      });

      expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-123");
      expect(userRepository.findRoleByPublicId).toHaveBeenCalledWith("user-123");
      expect(userRepository.getProfileStatsByPublicId).toHaveBeenCalledWith(
        "user-123",
      );
    });
  });

  describe("when the user does not exist", () => {
    it("throws UserNotFoundError", async () => {
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

      const action = () => useCase.execute("missing-user");

      await expect(action).rejects.toThrow(UserNotFoundError);

      expect(userRepository.findRoleByPublicId).not.toHaveBeenCalled();
      expect(userRepository.getProfileStatsByPublicId).not.toHaveBeenCalled();
    });
  });
});