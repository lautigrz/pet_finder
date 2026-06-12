import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { UpdateStatusDTO } from "./dto/update-status.dto";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";


export class UpdateStatus {

    constructor(private readonly reportRepository: ReportRepository) {

    }

    async execute(dto: UpdateStatusDTO) {

        const report: Report | null = await this.reportRepository.findByPublicId(dto.publicId);

        if (!report) {
            throw new ReportNotFoundError(dto.publicId);
        }

        if (dto.status === ReportStatus.RESOLVED) {
            report.resolve();
        } else if (dto.status === ReportStatus.CLOSED) {
            report.close();
        }
        await this.reportRepository.update(report);

    }
}