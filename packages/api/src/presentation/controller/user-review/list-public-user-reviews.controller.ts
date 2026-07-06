import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ListPublicUserReviewsUseCase } from "@application/usecase/user-review/list-public-user-reviews.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

@injectable()
export class ListPublicUserReviewsController {
  constructor(
    @inject("ListPublicUserReviewsUseCase")
    private readonly listPublicUserReviewsUseCase: ListPublicUserReviewsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviews = await this.listPublicUserReviewsUseCase.execute({
      publicId: req.params.publicId as string,
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 10),
    });

    res.status(200).json(reviews);
  });
}