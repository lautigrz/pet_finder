import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Request, Response } from "express";

import { UpsertUserReviewController } from "@presentation/controller/user-review/upsert-user-review.controller";

import { UpsertUserReviewUseCase } from "@application/usecase/user-review/upsert-user-review.usecase";

describe("UpsertUserReviewController", () => {
  let useCase: UpsertUserReviewUseCase;
  let controller: UpsertUserReviewController;

  let request: Partial<Request>;
  let response: Partial<Response>;

  beforeEach(() => {
    useCase = {
      execute: vi.fn(),
    } as unknown as UpsertUserReviewUseCase;

    controller = new UpsertUserReviewController(useCase);

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    request = {
      auth: {
        sub: "reviewer-1",
        email: "reviewer@test.com",
        isVerified: true,
      },
      params: {
        publicId: "reviewed-1",
      },
      body: {
        rating: 5,
        description: "Excellent owner",
      },
    } as Partial<Request>;
  });

  describe("handle", () => {
    it("creates the review and returns status 200", async () => {
      // Given
      const review = {
        id: 1,
        reviewerUserId: 10,
        reviewedUserId: 20,
        rating: 5,
        description: "Excellent owner",
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewer: {
          id: "reviewer-1",
          username: "reviewer",
          name: null,
          lastname: null,
          photoUrl: null,
        },
      };

      vi.mocked(useCase.execute).mockResolvedValue(review);

      // When
      await controller.handle(
        request as Request,
        response as Response,
        vi.fn(),
      );

      // Then
      expect(useCase.execute).toHaveBeenCalledWith({
        reviewerPublicId: "reviewer-1",
        reviewedPublicId: "reviewed-1",
        rating: 5,
        description: "Excellent owner",
      });

      expect(response.status).toHaveBeenCalledWith(200);

      expect(response.json).toHaveBeenCalledWith(review);
    });
  });
});
