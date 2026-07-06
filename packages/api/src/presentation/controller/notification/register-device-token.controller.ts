import { Request, Response } from "express";
import { RegisterDeviceTokenUseCase } from "@application/usecase/register-device-token/register-device-token.usecase";
import { RegisterDeviceTokenInput } from "@application/usecase/register-device-token/register-device-token.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { RegisterDeviceTokenBody } from "@presentation/schemas/notifications/device-token.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class RegisterDeviceTokenController {
  constructor(
    @inject("RegisterDeviceTokenUseCase")
    private readonly registerDeviceTokenUseCase: RegisterDeviceTokenUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as RegisterDeviceTokenBody;
    await this.registerDeviceTokenUseCase.execute(
      new RegisterDeviceTokenInput(req.auth!.sub, body.token),
    );
    res.status(201).json({ registered: true });
  });
}
