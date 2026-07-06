import { Request, Response } from "express";
import { ResolveAppealUseCase } from "@application/usecase/appeal-usecase/resolve-appeal.usecase";
import { ResolveAppealInput } from "@application/usecase/appeal-usecase/resolve-appeal.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ResolveAppealBody } from "@presentation/schemas/appeal/appeal.schema";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class ResolveAppealController {
  constructor(
    @inject("ResolveAppealUseCase")
    private readonly resolveAppealUseCase: ResolveAppealUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { publicId } = req.validated?.params as { publicId: string };
    const body = req.validated?.body as ResolveAppealBody;

    await this.resolveAppealUseCase.execute(new ResolveAppealInput(publicId, body.accept));

    logger.info("Appeal resolved successfully", { publicId, accept: body.accept });

    res.status(200).json({ message: "Appeal resolved successfully" });
  });
}
