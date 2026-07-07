import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionUpdatesUseCase } from "@application/usecase/mission-usecase/get-mission-updates.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class GetMissionUpdatesController {

  constructor(
    @inject("GetMissionUpdatesUseCase")
    private readonly useCase: GetMissionUpdatesUseCase
  ) { }

  handle = asyncHandler(async (req: Request, res: Response) => {
    const publicId = req.auth?.sub;
    if (!publicId) {
      throw new UserNotFoundError();
    }
    const responses = await this.useCase.execute(
      publicId
    );

    res.status(200).json(responses);
  });
}
