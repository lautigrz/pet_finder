import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { GetUserRatingUseCase } from "@application/usecase/user-review/get-user-rating.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

@injectable()
export class GetUserRatingController {
  constructor(
    @inject("GetUserRatingUseCase") private readonly getUserRatingUseCase: GetUserRatingUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rating = await this.getUserRatingUseCase.execute(req.params.publicId as string);
    res.status(200).json(rating);
  });
}
