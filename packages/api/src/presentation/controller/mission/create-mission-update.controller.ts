import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateMissionUpdateUseCase } from "@application/usecase/mission-usecase/create-mission-update.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { CreateMissionUpdateInput } from "@presentation/schemas/mission/mission.schema";

@injectable()
export class CreateMissionUpdateController {

  constructor(
    @inject("CreateMissionUpdateUseCase")
    private readonly useCase: CreateMissionUpdateUseCase
  ) { }

  handle = asyncHandler(async (req: Request, res: Response) => {
    const publicId = req.auth?.sub;
    if (!publicId) {
      throw new UserNotFoundError();
    }
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const parsed = req.validated?.body as CreateMissionUpdateInput;
    
    const result = await this.useCase.execute(
      {
        missionPublicId: parsed.missionPublicId,
        comment: parsed.comment,
        photoUrl: parsed.photoUrl ?? undefined,
        imageBuffer: files[0]?.buffer
      },
      publicId
    );

    res.status(201).json(result);
  });
}
