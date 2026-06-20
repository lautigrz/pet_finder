import { Request, Response } from "express";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { GetUserMatchNotificationsUseCase } from "@application/usecase/match-results-usecase/get-user-match-notifications.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

export class MatchResultsController {

    constructor(
        private readonly getMatchResultsUseCase: GetMatchResultsUseCase,
        private readonly getUserMatchNotificationsUseCase: GetUserMatchNotificationsUseCase,
    ) { }


    getMatchResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {

        const publicId = req.params.publicId;
        const matchResults = await this.getMatchResultsUseCase.execute(publicId as string);
        console.log("reportes", matchResults.length)
        res.json(matchResults);
    })

    getMyNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {

        const userPublicId = req.auth!.sub;
        const notifications = await this.getUserMatchNotificationsUseCase.execute(userPublicId);

        res.json(notifications);
    })

}