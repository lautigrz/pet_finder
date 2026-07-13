import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetLostNearbyNotificationsUseCase } from "@application/usecase/get-lost-nearby-notifications/get-lost-nearby-notifications.usecase";

@injectable()
export class GetLostNearbyNotificationsController {
  constructor(
    @inject("GetLostNearbyNotificationsUseCase")
    private readonly getLostNearbyNotificationsUseCase: GetLostNearbyNotificationsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const notifications =
      await this.getLostNearbyNotificationsUseCase.execute(
        req.auth!.sub,
      );

    res.status(200).json(notifications);
  });
}