import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionResponsesUseCase } from "@application/usecase/mission-response-usecase/get-mission-responses.usecase";

@injectable()
export class GetMissionResponsesController {

  constructor(

    @inject("GetMissionResponsesUseCase")
    private readonly useCase: GetMissionResponsesUseCase

  ) {}

  handle = asyncHandler(async (req: Request, res: Response) => {

   const responses = await this.useCase.execute(
  String(req.params.publicId)
);

    res.status(200).json(responses);

  });

}