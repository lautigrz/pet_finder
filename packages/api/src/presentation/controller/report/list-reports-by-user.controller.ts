import { Request, Response } from "express";
import { ListReportsByUserUseCase } from "@application/usecase/report-usecase/list-reports-by-user.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class ListReportsByUserController {
  constructor(
    @inject("ListReportsByUserUseCase")
    private readonly listReportsByUserUseCase: ListReportsByUserUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reports = await this.listReportsByUserUseCase.execute(req.params.publicId as string);
    res.status(200).json(reports);
  });
}
