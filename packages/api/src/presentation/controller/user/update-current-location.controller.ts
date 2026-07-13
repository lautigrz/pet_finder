import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { UpdateCurrentLocationUseCase } from "@application/usecase/update-current-location/update-current-location.usecase";
import { UpdateCurrentLocationInput } from "@application/usecase/update-current-location/update-current-location.input";
import { UpdateCurrentLocationBody } from "@presentation/schemas/user/user.schema";

@injectable()
export class UpdateCurrentLocationController {
  constructor(
    @inject("UpdateCurrentLocationUseCase")
    private readonly updateCurrentLocationUseCase: UpdateCurrentLocationUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as UpdateCurrentLocationBody;

    await this.updateCurrentLocationUseCase.execute(
      new UpdateCurrentLocationInput(
        req.auth!.sub,
        body.latitude,
        body.longitude,
      ),
    );

    res.sendStatus(204);
  });
}