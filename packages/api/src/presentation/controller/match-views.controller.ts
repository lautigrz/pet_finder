import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { MarkMatchSeenUseCase } from "@application/usecase/match-views-usecase/mark-match-seen.usecase";
import { GetSeenMatchesUseCase } from "@application/usecase/match-views-usecase/get-seen-matches.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { MarkMatchSeenParams } from "@presentation/schemas/match/match-views.schema";

@injectable()
export class MatchViewsController {
  constructor(
    @inject("MarkMatchSeenUseCase")
    private readonly markMatchSeenUseCase: MarkMatchSeenUseCase,
    @inject("GetSeenMatchesUseCase")
    private readonly getSeenMatchesUseCase: GetSeenMatchesUseCase,
  ) {}

  markSeen = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const { matchPublicId } = req.validated?.params as MarkMatchSeenParams;
    await this.markMatchSeenUseCase.execute(userPublicId, matchPublicId);
    res.status(204).send();
  });

  getSeen = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const seen = await this.getSeenMatchesUseCase.execute(userPublicId);
    res.json(seen);
  });
}
