import { Request, Response } from "express";
import { MarkMatchSeenUseCase } from "@application/usecase/match-views-usecase/mark-match-seen.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { MarkMatchSeenParams } from "@presentation/schemas/match/match-views.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class MarkMatchSeenController {
  constructor(
    @inject("MarkMatchSeenUseCase")
    private readonly markMatchSeenUseCase: MarkMatchSeenUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const { matchPublicId } = req.validated?.params as MarkMatchSeenParams;
    await this.markMatchSeenUseCase.execute(userPublicId, matchPublicId);
    res.status(204).send();
  });
}
