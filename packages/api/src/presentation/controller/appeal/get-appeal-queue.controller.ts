import { Request, Response } from "express";
import { GetAppealQueueUseCase } from "@application/usecase/appeal-usecase/get-appeal-queue.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { AppealQueueQuery } from "@presentation/schemas/appeal/appeal.schema";
import { AppealStatus } from "@domain/appeal/types/appeal-status";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetAppealQueueController {
  constructor(
    @inject("GetAppealQueueUseCase")
    private readonly getAppealQueueUseCase: GetAppealQueueUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as AppealQueueQuery;
    const status = query?.status as AppealStatus | undefined;

    const queue = await this.getAppealQueueUseCase.execute(status);

    logger.info("Fetched appeal queue successfully", { status: status ?? AppealStatus.PENDING, count: queue.length });

    res.status(200).json(queue.map((item) => ({
      publicId: item.appeal.publicId,
      targetType: item.appeal.targetType,
      targetPublicId: item.appeal.targetPublicId,
      message: item.appeal.message,
      status: item.appeal.status,
      createdAt: item.appeal.createdAt,
      appellant: item.appellant,
      case: item.caseContext,
    })));
  });
}
