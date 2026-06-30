import { Request, Response } from "express";
import { FollowReportUseCase } from "@application/usecase/report-usecase/follow-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class FollowReportController {
  constructor(
    @inject("FollowReportUseCase")
    private readonly followReportUseCase: FollowReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth?.sub;
    if (!userPublicId) throw new UserNotFoundError();

    const reportPublicId = req.params.publicId as string;

    await this.followReportUseCase.execute({ userPublicId, reportPublicId });
    logger.info("User followed report successfully", { userPublicId, reportPublicId });
    res.sendStatus(204);
  });
}
