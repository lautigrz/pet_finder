import { Request, Response } from "express";
import { GetFilteredReportsUseCase } from "@application/usecase/report-usecase/get-filter-reports.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { GetFilteredReportsDTO } from "@presentation/schemas/report/report-filter.schema";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetFilteredReportsController {
  constructor(
    @inject("GetFilteredReportsUseCase")
    private readonly getFilteredReportsUseCase: GetFilteredReportsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.validated?.query as GetFilteredReportsDTO;
    const reports = await this.getFilteredReportsUseCase.execute(dto);
    logger.info("Filtered reports successfully", { query: dto, count: reports.length });
    res.status(200).json(reports);
  });
}
