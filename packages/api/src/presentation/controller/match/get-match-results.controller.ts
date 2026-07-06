import { Request, Response } from "express";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetMatchResultsController {
  constructor(
    @inject("GetMatchResultsUseCase")
    private readonly getMatchResultsUseCase: GetMatchResultsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicId = req.params.publicId as string;
    const matchResults = await this.getMatchResultsUseCase.execute(publicId);
    res.json(matchResults);
  });
}
