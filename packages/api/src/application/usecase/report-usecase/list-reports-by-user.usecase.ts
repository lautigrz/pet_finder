import type { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import { ReportOutput } from "./dto/report.output";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { inject, injectable } from "tsyringe";

@injectable()
export class ListReportsByUserUseCase {
  constructor(
    @inject("ReportRepository")
    private reportRepository: ReportRepository,
    @inject("PetRepository")
    private petRepository: PetRepository,
  ) { }

  async execute(userPublicId: string): Promise<ReportOutput[]> {
    const reports = await this.reportRepository.findByUserPublicId(userPublicId);

    const visible = reports.filter((report) => report.status !== ReportStatus.CLOSED);

    return Promise.all(visible.map((report) => this.toOutput(report)));
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
