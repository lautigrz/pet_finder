import { Request, Response } from "express";
import { GetAdminStatsUseCase } from "@application/usecase/stats-usecase/get-admin-stats.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetAdminStatsController {
  constructor(
    @inject("GetAdminStatsUseCase")
    private readonly getAdminStatsUseCase: GetAdminStatsUseCase,
  ) {}

  handle = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getAdminStatsUseCase.execute();

    logger.info("Fetched admin stats successfully");

    res.status(200).json(result);
  });
}
