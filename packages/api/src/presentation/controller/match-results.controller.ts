import { Request, Response } from "express";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

export class MatchResultsController {

    constructor(
        private readonly getMatchResultsUseCase: GetMatchResultsUseCase,
    ) { }


    getMatchResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {

        const publicId = req.params.publicId;
        const matchResults = await this.getMatchResultsUseCase.execute(publicId as string);

        res.json(matchResults);
    })

}