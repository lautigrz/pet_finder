import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { UpsertUserReviewUseCase } from "@application/usecase/user-review/upsert-user-review.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

@injectable()
export class UpsertUserReviewController {
  constructor(
    @inject("UpsertUserReviewUseCase")
    private readonly upsertUserReviewUseCase: UpsertUserReviewUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const review = await this.upsertUserReviewUseCase.execute({
      reviewerPublicId: req.auth!.sub,
      reviewedPublicId: req.params.publicId as string,
      rating: req.body.rating,
      description: req.body.description,
    });

    res.status(200).json(review);
  });
}
