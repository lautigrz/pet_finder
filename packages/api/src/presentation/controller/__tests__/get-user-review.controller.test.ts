import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { ListUserReviewsController } from "@presentation/controller/user-review/list-user-reviews.controller";
import { ListUserReviewsUseCase } from "@application/usecase/user-review/list-user-reviews.usecase";

describe("ListUserReviewsController", () => {
  let useCase: ListUserReviewsUseCase;
  let controller: ListUserReviewsController;

  let request: Request;
  let response: Response;

  beforeEach(() => {
    useCase = {
      execute: vi.fn(),
    } as unknown as ListUserReviewsUseCase;

    controller = new ListUserReviewsController(useCase);

    request = {
      auth: {
        sub: "user-1",
        email: "user@test.com",
        isVerified: true,
      },
      query: {
        page: "2",
        pageSize: "15",
      },
    } as unknown as Request;

    response = {
      locals: {
        user: {
          userId: 123,
        },
      },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  describe("handle", () => {
    it("returns the authenticated user's reviews", async () => {
      // Given
      const reviews = {
        received: {
          items: [],
          page: 2,
          pageSize: 15,
          total: 0,
        },
        given: {
          items: [],
          page: 2,
          pageSize: 15,
          total: 0,
        },
      };

      vi.mocked(useCase.execute).mockResolvedValue(reviews);

      // When
      await controller.handle(request, response, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledWith({
        publicId: "user-1",
        page: 2,
        pageSize: 15,
      });

      expect(response.status).toHaveBeenCalledWith(200);

      expect(response.json).toHaveBeenCalledWith(reviews);
    });
  });
});
