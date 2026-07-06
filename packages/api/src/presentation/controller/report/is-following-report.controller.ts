import { Request, Response } from "express";
import { IsFollowingReportUseCase } from "@application/usecase/report-usecase/is-following-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { inject, injectable } from "tsyringe";

@injectable()
export class IsFollowingReportController {
  constructor(
    @inject("IsFollowingReportUseCase")
    private readonly isFollowingReportUseCase: IsFollowingReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth?.sub;
    if (!userPublicId) throw new UserNotFoundError();

    const reportPublicId = req.params.publicId as string;

    const result = await this.isFollowingReportUseCase.execute({ userPublicId, reportPublicId });
    res.status(200).json(result);
  });
}
