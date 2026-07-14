import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ListUserReviewsUseCase } from "@application/usecase/user-review/list-user-reviews.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

@injectable()
export class ListUserReviewsController {
  constructor(
    @inject("ListUserReviewsUseCase")
    private readonly listUserReviewsUseCase: ListUserReviewsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  
    const reviews = await this.listUserReviewsUseCase.execute({
    publicId: req.auth!.sub,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 10),
});

    res.status(200).json(reviews);
  });
}