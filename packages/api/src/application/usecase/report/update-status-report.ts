import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { UpdateStatusDTO } from "./dto/update-status.dto";


export class UpdateStatus {

    constructor(private readonly reportRepository: ReportRepository) {

    }

    async execute(dto: UpdateStatusDTO) {

        const report: Report | null = await this.reportRepository.findByPublicId(dto.publicId);

        if (!report) {
            throw new Error("Report not found")
        }

        if (dto.status === ReportStatus.RESOLVED) {
            report.resolve();
        } else if (dto.status === ReportStatus.CLOSED) {
            report.close();
        }
        await this.reportRepository.update(report);

    }
}