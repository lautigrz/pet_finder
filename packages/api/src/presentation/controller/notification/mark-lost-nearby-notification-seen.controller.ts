import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";

import { MarkLostNearbyNotificationSeenUseCase } from "@application/usecase/mark-lost-nearby-notification-seen/mark-lost-nearby-notification-seen.usecase";
import { MarkLostNearbyNotificationSeenInput } from "@application/usecase/mark-lost-nearby-notification-seen/mark-lost-nearby-notification-seen.input";

@injectable()
export class MarkLostNearbyNotificationSeenController {
  constructor(
    @inject("MarkLostNearbyNotificationSeenUseCase")
    private readonly useCase: MarkLostNearbyNotificationSeenUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const notificationPublicId = req.params.notificationPublicId as string;

    await this.useCase.execute(
      new MarkLostNearbyNotificationSeenInput(notificationPublicId),
    );

    res.status(204).send();
  });
}