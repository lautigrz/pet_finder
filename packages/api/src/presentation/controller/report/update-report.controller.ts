import { Request, Response } from "express";
import { UpdateReportUseCase } from "@application/usecase/report-usecase/update-report.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UpdateReportInput } from "@presentation/schemas/report/update-report.schema";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateReportController {
  constructor(
    @inject("UpdateReportUseCase")
    private readonly updateReportUseCase: UpdateReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth?.sub;
    if (!userPublicId) throw new UserNotFoundError();

    const body = req.validated?.body as UpdateReportInput;
    const publicId = req.validated?.params.publicId as string;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    await this.updateReportUseCase.execute(
      { publicId, ...body, newImages: files.map((f) => f.buffer) },
      userPublicId,
    );

    logger.info("Report updated successfully", { publicId });
    res.sendStatus(204);
  });
}
