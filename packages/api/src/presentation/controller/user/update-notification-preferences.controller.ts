import { Request, Response } from "express";
import { UpdateNotificationPreferencesUseCase } from "@application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { UpdateNotificationPreferencesInput } from "@application/usecase/update-notification-preferences/update-notification-preferences.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UpdateNotificationPreferencesBody } from "@presentation/schemas/user/user.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateNotificationPreferencesController {
  constructor(
    @inject("UpdateNotificationPreferencesUseCase")
    private readonly updateNotificationsPreferenceUseCase: UpdateNotificationPreferencesUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as UpdateNotificationPreferencesBody;
    const mutedUntil =
      body.mutedUntil === undefined
        ? undefined
        : body.mutedUntil === null
          ? null
          : new Date(body.mutedUntil);

    const preferences = await this.updateNotificationsPreferenceUseCase.execute(
      new UpdateNotificationPreferencesInput(
        req.auth!.sub,
        body.notificationRadius,
        body.lostReportsEnabled,
        body.sightingReportsEnabled,
        body.matchesEnabled,
        mutedUntil,
      ),
    );
    res.status(200).json(preferences);
  });
}
