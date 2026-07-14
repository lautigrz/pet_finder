import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListPublicUserReviewsUseCase } from "../list-public-user-reviews.usecase";
import { User } from "@domain/entities/User";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type {
  IUserReviewRepository,
  UserReviewData,
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

function review(): UserReviewData {
  return {
    id: 1,
    reviewerUserId: 20,
    reviewedUserId: 10,
    rating: 5,
    description: "Excellent",
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    reviewer: {
      id: "reviewer-1",
      username: "reviewer",
      name: "John",
      lastname: "Doe",
      photoUrl: null,
    },
  };
}

describe("ListPublicUserReviewsUseCase", () => {
  let userRepository: IUserRepository;
  let userReviewRepository: IUserReviewRepository;
  let useCase: ListPublicUserReviewsUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    userReviewRepository = {
      findByReviewedUserId: vi.fn(),
    } as unknown as IUserReviewRepository;

    useCase = new ListPublicUserReviewsUseCase(
      userRepository,
      userReviewRepository,
    );
  });

  describe("execute", () => {
    it("returns the received reviews", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      vi.mocked(userReviewRepository.findByReviewedUserId).mockResolvedValue({
        items: [review()],
        page: 2,
        pageSize: 10,
        total: 1,
      });

      // When
      const result = await useCase.execute({
        publicId: "user-1",
        page: 2,
        pageSize: 10,
      });

      // Then
      expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-1");

      expect(userReviewRepository.findByReviewedUserId).toHaveBeenCalledWith({
        reviewedUserId: 10,
        page: 2,
        pageSize: 10,
      });

      expect(result).toEqual({
        items: [review()],
        page: 2,
        pageSize: 10,
        total: 1,
      });
    });

    it.each([
      ["missing user", null],
      ["suspended user", user(true)],
    ])("throws UserNotFoundError for %s", async (_case, foundUser) => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(foundUser);

      // When
      const action = () =>
        useCase.execute({
          publicId: "user-1",
          page: 1,
          pageSize: 10,
        });

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);

      expect(userReviewRepository.findByReviewedUserId).not.toHaveBeenCalled();
    });

    it("normalizes page and pageSize before querying", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      vi.mocked(userReviewRepository.findByReviewedUserId).mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 50,
        total: 0,
      });

      // When
      await useCase.execute({
        publicId: "user-1",
        page: 0,
        pageSize: 100,
      });

      // Then
      expect(userReviewRepository.findByReviewedUserId).toHaveBeenCalledWith({
        reviewedUserId: 10,
        page: 1,
        pageSize: 50,
      });
    });
  });
});
