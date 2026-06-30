import { Request, Response } from "express";
import { CreateContentReportUseCase } from "@application/usecase/content-report-usecase/create-content-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateContentReportInput } from "@presentation/schemas/content-report/content-report.schema";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateContentReportController {
  constructor(
    @inject("CreateContentReportUseCase")
    private readonly createContentReportUseCase: CreateContentReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = req.validated?.body as CreateContentReportInput;
    const reporterPublicId = req.auth?.sub;

    if (!reporterPublicId) throw new UserNotFoundError();

    const result = await this.createContentReportUseCase.execute(
      {
        targetType: parsed.targetType as ContentReportTargetType,
        targetPublicId: parsed.targetPublicId,
        reason: parsed.reason as ContentReportReason,
        description: parsed.description ?? null,
      },
      reporterPublicId,
    );

    logger.info("Content report created successfully", {
      targetType: parsed.targetType,
      autoFlagged: result.autoFlagged,
    });

    res.status(201).json({
      message: "Content report created successfully",
      publicId: result.publicId,
      autoFlagged: result.autoFlagged,
    });
  });
}
