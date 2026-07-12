import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { ScoreMissionUpdateUseCase } from "@application/usecase/mission-usecase/score-mission-update.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ScoreMissionUpdateInput } from "@presentation/schemas/mission/mission.schema";

@injectable()
export class ScoreMissionUpdateController {
  constructor(
    @inject("ScoreMissionUpdateUseCase")
    private readonly useCase: ScoreMissionUpdateUseCase
  ) { }

  handle = asyncHandler(async (req: Request, res: Response) => {
    const executorPublicId = req.auth?.sub;
    if (!executorPublicId) {
      throw new UserNotFoundError();
    }

    const updatePublicId = req.params.publicId as string;
    const parsed = req.validated?.body as ScoreMissionUpdateInput;

    await this.useCase.execute(
      {
        updatePublicId,
        points: parsed.points,
      },
      executorPublicId
    );

    res.status(200).json({
      status: "success",
      message: "Comment scored successfully",
    });
  });
}
