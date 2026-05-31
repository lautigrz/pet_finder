import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportType } from "@domain/report/types/report.type";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { PaginationParams } from "@domain/shared/pagination/pagination";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import { ReportOutputDto } from "./get.report.output";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ListUserReportsOutputDto } from "./list-user-reports.output";

export class ListUserReportsUseCase {
  constructor(
    private reportRepository: ReportRepository,
    private petRepository: PetRepository,
  ) { }

  async execute(userPublicId: string, pagination: PaginationParams): Promise<ListUserReportsOutputDto> {
    const { items: reports, total } = await this.reportRepository.findByUserPublicId(userPublicId, pagination);

    const data = await Promise.all(reports.map((report) => this.toOutput(report)));

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: pagination.limit > 0 ? Math.ceil(total / pagination.limit) : 0,
      },
    };
  }

  private async toOutput(report: Report): Promise<ReportOutputDto> {
    if (report.reportType === ReportType.LOST) {
      const details = report.details as LostReportDetails;
      const pet = await this.petRepository.findById(details.petId);

      if (!pet) {
        throw new PetNotFoundError(details.petId);
      }

      return ReportOutputMapper.toOutput(report, pet);
    }

    return ReportOutputMapper.toOutput(report);
  }
}
