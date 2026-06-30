import { Request, Response } from "express";
import { GetSeenMatchesUseCase } from "@application/usecase/match-views-usecase/get-seen-matches.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetSeenMatchesController {
  constructor(
    @inject("GetSeenMatchesUseCase")
    private readonly getSeenMatchesUseCase: GetSeenMatchesUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const seen = await this.getSeenMatchesUseCase.execute(userPublicId);
    res.json(seen);
  });
}
