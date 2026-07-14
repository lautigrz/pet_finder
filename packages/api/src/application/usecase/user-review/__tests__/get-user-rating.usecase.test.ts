import { beforeEach, describe, expect, it, vi } from "vitest";

import { GetUserRatingUseCase } from "../get-user-rating.usecase";
import { User } from "@domain/entities/User";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type {
  IUserReviewRepository,
  UserRatingSummary,
} from "@domain/repositories/IUserReviewRepository";

function user(isSuspended = false): User {
  return User.reconstruct(
    10,
    "user-1",
    "user@test.com",
    "user",
    null,
    true,
    new Date("2026-07-13T12:00:00.000Z"),
    null,
    null,
    null,
    isSuspended,
  );
}

describe("GetUserRatingUseCase", () => {
  let userRepository: IUserRepository;
  let userReviewRepository: IUserReviewRepository;
  let useCase: GetUserRatingUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    userReviewRepository = {
      getRatingSummary: vi.fn(),
    } as unknown as IUserReviewRepository;

    useCase = new GetUserRatingUseCase(userRepository, userReviewRepository);
  });

  describe("execute", () => {
    it("returns the user's rating summary", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      const summary: UserRatingSummary = {
        average: 4.7,
        count: 18,
      };

      vi.mocked(userReviewRepository.getRatingSummary).mockResolvedValue(
        summary,
      );

      // When
      const result = await useCase.execute("user-1");

      // Then
      expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-1");

      expect(userReviewRepository.getRatingSummary).toHaveBeenCalledWith(10);

      expect(result).toEqual(summary);
    });

    it.each([
      ["missing user", null],
      ["suspended user", user(true)],
    ])("throws UserNotFoundError for %s", async (_case, foundUser) => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(foundUser);

      // When
      const action = () => useCase.execute("user-1");

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);

      expect(userReviewRepository.getRatingSummary).not.toHaveBeenCalled();
    });
  });
});
