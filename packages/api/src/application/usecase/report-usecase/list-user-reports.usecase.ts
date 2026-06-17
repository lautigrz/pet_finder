import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportType } from "@domain/report/types/report.type";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { PaginationParams } from "@domain/shared/pagination/pagination";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import { ReportOutput } from "./dto/report.output";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ListUserReportsOutputDto } from "./list-user-reports.output";
import { GetFilteredReportsDTO } from "./dto/get-filtered-reports.dto";
import { haversineKm } from "@domain/shared/geo/haversine";

export class ListUserReportsUseCase {
  constructor(
    private reportRepository: ReportRepository,
    private petRepository: PetRepository,
  ) { }

  async execute(userPublicId: string, pagination: PaginationParams, filters: GetFilteredReportsDTO = {}): Promise<ListUserReportsOutputDto> {
    const reports = await this.reportRepository.findByUserPublicId(userPublicId, {
      reportType: filters.reportType,
      animalType: filters.animalType,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      q: filters.q,
    });

    const withinRadius = this.filterByRadius(reports, filters);

    const total = withinRadius.length;
    const start = (pagination.page - 1) * pagination.limit;
    const pageItems = withinRadius.slice(start, start + pagination.limit);

    const data = await Promise.all(pageItems.map((report) => this.toOutput(report)));

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

  private filterByRadius(reports: Report[], filters: GetFilteredReportsDTO): Report[] {
    if (filters.lat === undefined || filters.lng === undefined || filters.radiusKm === undefined) {
      return reports;
    }

    const origin = { latitude: filters.lat, longitude: filters.lng };

    return reports.filter((report) =>
      haversineKm(origin, {
        latitude: report.location.latitude,
        longitude: report.location.longitude,
      }) <= filters.radiusKm!
    );
  }

  private async toOutput(report: Report): Promise<ReportOutput> {
    if (report.reportType === ReportType.LOST) {
      const details = report.details as LostReportDetails;
      const pet = await this.petRepository.findById(details.petId);
      if (!pet) throw new PetNotFoundError(details.petId);
      const reportImages = await this.reportRepository.findImagesByReportId(report.publicId);
      return ReportOutputMapper.toOutput(report, pet, undefined, reportImages);
    }

    const reportImages = await this.reportRepository.findImagesByReportId(report.publicId);
    return ReportOutputMapper.toOutput(report, undefined, undefined, reportImages);
  }
}
