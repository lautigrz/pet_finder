import { Request, Response } from "express";
import { GetNotificationPreferencesUseCase } from "@application/usecase/get-notification-preferences/get-notification-preferences.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetNotificationPreferencesController {
  constructor(
    @inject("GetNotificationPreferencesUseCase")
    private readonly getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const preferences = await this.getNotificationPreferencesUseCase.execute(req.auth!.sub);
    res.status(200).json(preferences);
  });
}
