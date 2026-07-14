import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { ListPublicUserReviewsController } from "@presentation/controller/user-review/list-public-user-reviews.controller";
import { ListPublicUserReviewsUseCase } from "@application/usecase/user-review/list-public-user-reviews.usecase";

describe("ListPublicUserReviewsController", () => {
  let useCase: ListPublicUserReviewsUseCase;
  let controller: ListPublicUserReviewsController;

  let request: Request;
  let response: Response;

  beforeEach(() => {
    useCase = {
      execute: vi.fn(),
    } as unknown as ListPublicUserReviewsUseCase;

    controller = new ListPublicUserReviewsController(useCase);

    request = {
      params: {
        publicId: "user-1",
      },
      query: {
        page: "2",
        pageSize: "15",
      },
    } as unknown as Request;

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  describe("handle", () => {
    it("returns the public reviews of a user", async () => {
      // Given
      const reviews = {
        items: [],
        page: 2,
        pageSize: 15,
        total: 0,
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
