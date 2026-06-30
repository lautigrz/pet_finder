import { Request, Response } from "express";
import { GetUserMatchNotificationsUseCase } from "@application/usecase/match-results-usecase/get-user-match-notifications.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetMatchNotificationsController {
  constructor(
    @inject("GetUserMatchNotificationsUseCase")
    private readonly getUserMatchNotificationsUseCase: GetUserMatchNotificationsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const notifications = await this.getUserMatchNotificationsUseCase.execute(userPublicId);
    res.json(notifications);
  });
}
