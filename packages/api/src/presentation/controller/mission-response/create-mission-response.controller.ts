import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateMissionResponseUseCase } from "@application/usecase/mission-response-usecase/create-mission-response.usecase";

@injectable()
export class CreateMissionResponseController {

  constructor(

    @inject("CreateMissionResponseUseCase")
    private readonly useCase: CreateMissionResponseUseCase

  ) {}

  handle = asyncHandler(async (req: Request, res: Response) => {

    if (!req.auth) {
      throw new Error("Unauthorized");
    }

    const result = await this.useCase.execute(

  {
    missionPublicId: req.body.missionPublicId,
    comment: req.body.comment,
    photoUrl: req.body.photoUrl
  },

  req.auth!.sub

);

    res.status(201).json(result);

  });

}