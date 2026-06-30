import { Request, Response } from "express";
import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { CreateReportDTO } from "@application/usecase/report-usecase/dto/create-report.dto";
import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateReportInput } from "@presentation/schemas/report/create-report.schema";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateReportController {
  constructor(
    @inject("CreateReportUseCase")
    private readonly useCase: CreateReportUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = req.validated?.body as CreateReportInput;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const userPublicId = req.auth?.sub;

    if (!userPublicId) throw new UserNotFoundError();

    const dto = { ...parsed, images: files.map((f) => f.buffer) } as unknown as CreateReportDTO;
    const result = await this.useCase.execute(dto, userPublicId);

    logger.info("Report created successfully", { type: parsed.type });
    res.status(201).json({ message: "Report created successfully", publicId: result.publicId });
  });
}
