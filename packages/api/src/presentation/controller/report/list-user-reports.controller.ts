import { Request, Response } from "express";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ListUserReportsQuery } from "@presentation/schemas/report/list-user-reports.schema";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class ListUserReportsController {
  constructor(
    @inject("ListUserReportsUseCase")
    private readonly listUserReportsUseCase: ListUserReportsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth?.sub;
    if (!userId) throw new UserNotFoundError();

    const query = req.validated?.query as ListUserReportsQuery;
    const pagination = { page: query.page, limit: query.limit };
    const filters = {
      reportType: query.reportType,
      animalType: query.animalType,
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      q: query.q,
    };

    const result = await this.listUserReportsUseCase.execute(userId, pagination, filters);
    logger.info("Listed user reports successfully", { userId, page: pagination.page, limit: pagination.limit });
    res.status(200).json(result);
  });
}
