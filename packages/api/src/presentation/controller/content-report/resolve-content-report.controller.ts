import { Request, Response } from "express";
import { ResolveContentReportUseCase } from "@application/usecase/content-report-usecase/resolve-content-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ResolveContentReportInput } from "@presentation/schemas/content-report/content-report.schema";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class ResolveContentReportController {
  constructor(
    @inject("ResolveContentReportUseCase")
    private readonly resolveContentReportUseCase: ResolveContentReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { publicId } = req.validated?.params as { publicId: string };
    const body = req.validated?.body as ResolveContentReportInput;

    await this.resolveContentReportUseCase.execute({
      publicId,
      status: body.status as ContentReportStatus,
      suspensionReason: body.suspensionReason,
    });

    logger.info("Content report resolved successfully", { publicId, status: body.status });

    res.status(204).send();
  });
}
