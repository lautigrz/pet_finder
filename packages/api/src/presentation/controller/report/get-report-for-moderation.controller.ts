import { Request, Response } from "express";
import { GetReportForModerationUseCase } from "@application/usecase/report-usecase/get-report-for-moderation.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetReportForModerationController {
  constructor(
    @inject("GetReportForModerationUseCase")
    private readonly getReportForModerationUseCase: GetReportForModerationUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicId = req.params.publicId as string;

    const result = await this.getReportForModerationUseCase.execute(publicId);

    logger.info("Report fetched for moderation", { publicId });

    res.status(200).json(result);
  });
}
