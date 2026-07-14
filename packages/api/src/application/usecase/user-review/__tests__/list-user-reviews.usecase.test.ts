import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListUserReviewsUseCase } from "../list-user-reviews.usecase";
import { User } from "@domain/entities/User";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type {
  GivenUserReviewData,
  IUserReviewRepository,
  UserReviewData,
} from "@domain/repositories/IUserReviewRepository";

function user(isSuspended = false): User {
  return User.reconstruct(
    10,
    "user-1",
    "user-1@test.com",
    "user-1",
    null,
    true,
    new Date("2026-07-13T12:00:00.000Z"),
    null,
    null,
    null,
    isSuspended,
  );
}

function receivedReview(): UserReviewData {
  return {
    id: 1,
    reviewerUserId: 20,
    reviewedUserId: 10,
    rating: 5,
    description: "Great help",
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    reviewer: {
      id: "reviewer-1",
      username: "reviewer",
      name: "Review",
      lastname: "Author",
      photoUrl: null,
    },
  };
}

function givenReview(): GivenUserReviewData {
  return {
    id: 2,
    reviewerUserId: 10,
    reviewedUserId: 30,
    rating: 4,
    description: null,
    createdAt: new Date("2026-07-12T12:00:00.000Z"),
    updatedAt: new Date("2026-07-12T12:00:00.000Z"),
    reviewed: {
      id: "reviewed-1",
      username: "reviewed",
      name: "Reviewed",
      lastname: "User",
      photoUrl: "photo.jpg",
    },
  };
}

describe("ListUserReviewsUseCase", () => {
  let userRepository: IUserRepository;
  let userReviewRepository: IUserReviewRepository;
  let useCase: ListUserReviewsUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    userReviewRepository = {
      findByReviewedUserId: vi.fn(),
      findByReviewerUserId: vi.fn(),
    } as unknown as IUserReviewRepository;

    useCase = new ListUserReviewsUseCase(userRepository, userReviewRepository);
  });

  describe("execute", () => {
    it("returns received and given reviews for the user", async () => {
      // Given
      const received = receivedReview();
      const given = givenReview();

      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      vi.mocked(userReviewRepository.findByReviewedUserId).mockResolvedValue({
        items: [received],
        page: 2,
        pageSize: 10,
        total: 1,
      });

      vi.mocked(userReviewRepository.findByReviewerUserId).mockResolvedValue({
        items: [given],
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

      expect(userReviewRepository.findByReviewerUserId).toHaveBeenCalledWith({
        reviewerUserId: 10,
        page: 2,
        pageSize: 10,
      });

      expect(result).toEqual({
        received: {
          items: [received],
          page: 2,
          pageSize: 10,
          total: 1,
        },
        given: {
          items: [given],
          page: 2,
          pageSize: 10,
          total: 1,
        },
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

      expect(userReviewRepository.findByReviewerUserId).not.toHaveBeenCalled();
    });

    it("normalizes page and pageSize to their minimum values", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      vi.mocked(userReviewRepository.findByReviewedUserId).mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 1,
        total: 0,
      });

      vi.mocked(userReviewRepository.findByReviewerUserId).mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 1,
        total: 0,
      });

      // When
      await useCase.execute({
        publicId: "user-1",
        page: 0,
        pageSize: 0,
      });

      // Then
      expect(userReviewRepository.findByReviewedUserId).toHaveBeenCalledWith({
        reviewedUserId: 10,
        page: 1,
        pageSize: 1,
      });

      expect(userReviewRepository.findByReviewerUserId).toHaveBeenCalledWith({
        reviewerUserId: 10,
        page: 1,
        pageSize: 1,
      });
    });

    it("limits pageSize to 50", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(user());

      vi.mocked(userReviewRepository.findByReviewedUserId).mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 50,
        total: 0,
      });

      vi.mocked(userReviewRepository.findByReviewerUserId).mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 50,
        total: 0,
      });

      // When
      await useCase.execute({
        publicId: "user-1",
        page: 1,
        pageSize: 100,
      });

      // Then
      expect(userReviewRepository.findByReviewedUserId).toHaveBeenCalledWith({
        reviewedUserId: 10,
        page: 1,
        pageSize: 50,
      });

      expect(userReviewRepository.findByReviewerUserId).toHaveBeenCalledWith({
        reviewerUserId: 10,
        page: 1,
        pageSize: 50,
      });
    });
  });
});
