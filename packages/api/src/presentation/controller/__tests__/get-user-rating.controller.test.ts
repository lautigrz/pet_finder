import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { GetUserRatingController } from "@presentation/controller/user-review/get-user-rating.controller";
import { GetUserRatingUseCase } from "@application/usecase/user-review/get-user-rating.usecase";

describe("GetUserRatingController", () => {
  let useCase: GetUserRatingUseCase;
  let controller: GetUserRatingController;

  let request: Request;
  let response: Response;

  beforeEach(() => {
    useCase = {
      execute: vi.fn(),
    } as unknown as GetUserRatingUseCase;

    controller = new GetUserRatingController(useCase);

    request = {
      params: {
        publicId: "user-1",
      },
    } as unknown as Request;

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  describe("handle", () => {
    it("returns the user's rating summary", async () => {
      // Given
      const rating = {
        average: 4.8,
        count: 27,
      };

      vi.mocked(useCase.execute).mockResolvedValue(rating);

      // When
      await controller.handle(request, response, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledOnce();

      expect(useCase.execute).toHaveBeenCalledWith("user-1");

      expect(response.status).toHaveBeenCalledWith(200);

      expect(response.json).toHaveBeenCalledWith(rating);
    });
  });
});
