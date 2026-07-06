import { Request, Response } from "express";
import { RemoveDeviceTokenUseCase } from "@application/usecase/remove-device-token/remove-device-token.usecase";
import { RemoveDeviceTokenInput } from "@application/usecase/remove-device-token/remove-device-token.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { RemoveDeviceTokenBody } from "@presentation/schemas/notifications/device-token.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class RemoveDeviceTokenController {
  constructor(
    @inject("RemoveDeviceTokenUseCase")
    private readonly removeDeviceTokenUseCase: RemoveDeviceTokenUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as RemoveDeviceTokenBody;
    await this.removeDeviceTokenUseCase.execute(
      new RemoveDeviceTokenInput(req.auth!.sub, body.token),
    );
    res.status(204).send();
  });
}
