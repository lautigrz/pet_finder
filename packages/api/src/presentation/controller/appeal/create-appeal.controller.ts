import { Request, Response } from "express";
import { CreateAppealUseCase } from "@application/usecase/appeal-usecase/create-appeal.usecase";
import { CreateAppealInput } from "@application/usecase/appeal-usecase/create-appeal.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateAppealBody } from "@presentation/schemas/appeal/appeal.schema";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateAppealController {
  constructor(
    @inject("CreateAppealUseCase")
    private readonly createAppealUseCase: CreateAppealUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateAppealBody;

    const result = await this.createAppealUseCase.execute(new CreateAppealInput(body.token, body.message));

    logger.info("Appeal created successfully", { publicId: result.publicId });

    res.status(201).json({ message: "Appeal created successfully", publicId: result.publicId });
  });
}
