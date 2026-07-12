import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetCommentPointValuesUseCase } from "@application/usecase/mission-usecase/get-comment-point-values.usecase";

@injectable()
export class GetCommentPointValuesController {
  constructor(
    @inject("GetCommentPointValuesUseCase")
    private readonly useCase: GetCommentPointValuesUseCase
  ) { }

  handle = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.useCase.execute();
    res.status(200).json(result);
  });
}
