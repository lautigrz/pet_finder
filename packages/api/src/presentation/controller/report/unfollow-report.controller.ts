import { Request, Response } from "express";
import { UnfollowReportUseCase } from "@application/usecase/report-usecase/unfollow-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class UnfollowReportController {
  constructor(
    @inject("UnfollowReportUseCase")
    private readonly unfollowReportUseCase: UnfollowReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth?.sub;
    if (!userPublicId) throw new UserNotFoundError();

    const reportPublicId = req.params.publicId as string;

    await this.unfollowReportUseCase.execute({ userPublicId, reportPublicId });
    logger.info("User unfollowed report successfully", { userPublicId, reportPublicId });
    res.sendStatus(204);
  });
}
