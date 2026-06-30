import { Request, Response } from "express";
import { UpdateStatus } from "@application/usecase/report-usecase/update-status-report";
import { UpdateStatusDTO } from "@application/usecase/report-usecase/dto/update-status.dto";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateReportStatusController {
  constructor(
    @inject("UpdateStatusUseCase")
    private readonly updateStatusUseCase: UpdateStatus,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.validated?.body as UpdateStatusDTO;
    const publicId = req.validated?.params.publicId;

    dto.publicId = publicId;
    await this.updateStatusUseCase.execute(dto);

    logger.info("Updated report status successfully", { publicId, status: dto.status });
    res.sendStatus(204);
  });
}
