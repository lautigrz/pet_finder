import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpsertUserReviewUseCase } from "../upsert-user-review.usecase";
import { User } from "@domain/entities/User";
import { CannotReviewYourselfError } from "@domain/errors/CannotReviewYourselfError";
import { InvalidUserReviewRatingError } from "@domain/errors/InvalidUserReviewRatingError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type {
  IUserReviewRepository,
  UserReviewData,
} from "@domain/repositories/IUserReviewRepository";

function user(input: {
  internalId: number;
  publicId: string;
  isSuspended?: boolean;
}): User {
  return User.reconstruct(
    input.internalId,
    input.publicId,
    `${input.publicId}@test.com`,
    input.publicId,
    null,
    true,
    new Date("2026-07-13T12:00:00.000Z"),
    null,
    null,
    null,
    input.isSuspended ?? false,
  );
}

function review(overrides: Partial<UserReviewData> = {}): UserReviewData {
  return {
    id: 1,
    reviewerUserId: 10,
    reviewedUserId: 20,
    rating: 5,
    description: "Excellent help",
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    reviewer: {
      id: "reviewer-1",
      username: "reviewer",
      name: "Review",
      lastname: "Author",
      photoUrl: null,
    },
    ...overrides,
  };
}

describe("UpsertUserReviewUseCase", () => {
  let userRepository: IUserRepository;
  let userReviewRepository: IUserReviewRepository;
  let useCase: UpsertUserReviewUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    userReviewRepository = {
      upsert: vi.fn(),
    } as unknown as IUserReviewRepository;

    useCase = new UpsertUserReviewUseCase(userRepository, userReviewRepository);
  });

  describe("execute", () => {
    it("creates the review and returns its output", async () => {
      // Given
      const reviewer = user({
        internalId: 10,
        publicId: "reviewer-1",
      });

      const reviewed = user({
        internalId: 20,
        publicId: "reviewed-1",
      });

      const storedReview = review();

      vi.mocked(userRepository.findByPublicId)
        .mockResolvedValueOnce(reviewer)
        .mockResolvedValueOnce(reviewed);

      vi.mocked(userReviewRepository.upsert).mockResolvedValue(storedReview);

      // When
      const result = await useCase.execute({
        reviewerPublicId: "reviewer-1",
        reviewedPublicId: "reviewed-1",
        rating: 5,
        description: "  Excellent help  ",
      });

      // Then
      expect(userRepository.findByPublicId).toHaveBeenNthCalledWith(
        1,
        "reviewer-1",
      );

      expect(userRepository.findByPublicId).toHaveBeenNthCalledWith(
        2,
        "reviewed-1",
      );

      expect(userReviewRepository.upsert).toHaveBeenCalledWith({
        reviewerUserId: 10,
        reviewedUserId: 20,
        rating: 5,
        description: "Excellent help",
      });

      expect(result).toEqual(storedReview);
    });

    it.each([0, 6, 2.5])(
      "throws InvalidUserReviewRatingError for rating %s",
      async (rating) => {
        // Given
        const input = {
          reviewerPublicId: "reviewer-1",
          reviewedPublicId: "reviewed-1",
          rating,
        };

        // When
        const action = () => useCase.execute(input);

        // Then
        await expect(action).rejects.toThrow(InvalidUserReviewRatingError);

        expect(userRepository.findByPublicId).not.toHaveBeenCalled();
        expect(userReviewRepository.upsert).not.toHaveBeenCalled();
      },
    );

    it("throws CannotReviewYourselfError when both public ids are equal", async () => {
      // Given
      const input = {
        reviewerPublicId: "user-1",
        reviewedPublicId: "user-1",
        rating: 5,
      };

      // When
      const action = () => useCase.execute(input);

      // Then
      await expect(action).rejects.toThrow(CannotReviewYourselfError);

      expect(userRepository.findByPublicId).not.toHaveBeenCalled();
      expect(userReviewRepository.upsert).not.toHaveBeenCalled();
    });

    it.each([
      [
        "missing reviewer",
        null,
        user({
          internalId: 20,
          publicId: "reviewed-1",
        }),
      ],
      [
        "suspended reviewer",
        user({
          internalId: 10,
          publicId: "reviewer-1",
          isSuspended: true,
        }),
        user({
          internalId: 20,
          publicId: "reviewed-1",
        }),
      ],
      [
        "missing reviewed user",
        user({
          internalId: 10,
          publicId: "reviewer-1",
        }),
        null,
      ],
      [
        "suspended reviewed user",
        user({
          internalId: 10,
          publicId: "reviewer-1",
        }),
        user({
          internalId: 20,
          publicId: "reviewed-1",
          isSuspended: true,
        }),
      ],
    ])("throws UserNotFoundError for %s", async (_case, reviewer, reviewed) => {
      // Given
      vi.mocked(userRepository.findByPublicId)
        .mockResolvedValueOnce(reviewer)
        .mockResolvedValueOnce(reviewed);

      // When
      const action = () =>
        useCase.execute({
          reviewerPublicId: "reviewer-1",
          reviewedPublicId: "reviewed-1",
          rating: 5,
        });

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);

      expect(userReviewRepository.upsert).not.toHaveBeenCalled();
    });

    it("stores null when the description is empty after trimming", async () => {
      // Given
      vi.mocked(userRepository.findByPublicId)
        .mockResolvedValueOnce(
          user({
            internalId: 10,
            publicId: "reviewer-1",
          }),
        )
        .mockResolvedValueOnce(
          user({
            internalId: 20,
            publicId: "reviewed-1",
          }),
        );

      vi.mocked(userReviewRepository.upsert).mockResolvedValue(
        review({
          description: null,
        }),
      );

      // When
      await useCase.execute({
        reviewerPublicId: "reviewer-1",
        reviewedPublicId: "reviewed-1",
        rating: 4,
        description: "   ",
      });

      // Then
      expect(userReviewRepository.upsert).toHaveBeenCalledWith({
        reviewerUserId: 10,
        reviewedUserId: 20,
        rating: 4,
        description: null,
      });
    });
  });
});
