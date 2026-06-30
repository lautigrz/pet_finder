import { Request, Response } from "express";
import { GetContentReportQueueUseCase } from "@application/usecase/content-report-usecase/get-content-report-queue.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ContentReportQueueQuery } from "@presentation/schemas/content-report/content-report.schema";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetContentReportQueueController {
  constructor(
    @inject("GetContentReportQueueUseCase")
    private readonly getContentReportQueueUseCase: GetContentReportQueueUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ContentReportQueueQuery;
    const status = query?.status as ContentReportStatus | undefined;

    const result = await this.getContentReportQueueUseCase.execute(status);

    logger.info("Fetched content report queue successfully", {
      status: status ?? ContentReportStatus.PENDING,
      count: result.length,
    });

    res.status(200).json(result);
  });
}
