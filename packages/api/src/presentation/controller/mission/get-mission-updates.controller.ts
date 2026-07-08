import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionUpdatesUseCase } from "@application/usecase/mission-usecase/get-mission-updates.usecase";


@injectable()
export class GetMissionUpdatesController {

  constructor(
    @inject("GetMissionUpdatesUseCase")
    private readonly useCase: GetMissionUpdatesUseCase
  ) { }

  handle = asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;
    const responses = await this.useCase.execute(
      publicId as string
    );

    res.status(200).json(responses);
  });
}
