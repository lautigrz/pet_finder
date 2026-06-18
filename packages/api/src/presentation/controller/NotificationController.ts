import { Request, Response } from "express";
import { RegisterDeviceTokenUseCase } from "../../application/usecase/register-device-token/register-device-token.usecase";
import { RegisterDeviceTokenInput } from "../../application/usecase/register-device-token/register-device-token.input";
import { RemoveDeviceTokenUseCase } from "../../application/usecase/remove-device-token/remove-device-token.usecase";
import { RemoveDeviceTokenInput } from "../../application/usecase/remove-device-token/remove-device-token.input";
import { RegisterDeviceTokenBody, RemoveDeviceTokenBody } from "../schemas/notifications/device-token.schema";
import { asyncHandler } from "@presentation/handler/async-handler";

export class NotificationController {
  constructor(
    private readonly registerDeviceTokenUseCase: RegisterDeviceTokenUseCase,
    private readonly removeDeviceTokenUseCase: RemoveDeviceTokenUseCase,
  ) { }

  registerToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as RegisterDeviceTokenBody;
    await this.registerDeviceTokenUseCase.execute(
      new RegisterDeviceTokenInput(req.auth!.sub, body.token),
    );
    res.status(201).json({ registered: true });
  });

  removeToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as RemoveDeviceTokenBody;
    await this.removeDeviceTokenUseCase.execute(
      new RemoveDeviceTokenInput(req.auth!.sub, body.token),
    );
    res.status(204).send();
  });
}
