import { Request, Response } from "express";
import { GetReportUseCase } from "@application/usecase/report-usecase/get-report-usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetReportController {
  constructor(
    @inject("GetReportUseCase")
    private readonly getReportUseCase: GetReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicId = req.params.publicId as string;
    const report = await this.getReportUseCase.execute(publicId);
    logger.info("Fetched report successfully", { publicId });
    res.status(200).json(report);
  });
}
