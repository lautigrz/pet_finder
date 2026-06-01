import { ReportRepository, ReportWithPet } from "@domain/report/repositories/report.repository";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { ReportOutput } from "./dto/report.output";


export type { ReportOutput };

export class GetReportUseCase {
    constructor(private reportRepository: ReportRepository) { }

    async execute(publicId: string): Promise<ReportOutput> {
        const result: ReportWithPet | null = await this.reportRepository.findByPublicId(publicId);

        if (!result) {
            throw new ReportNotFoundError(publicId);
        }

        const { report, pet } = result;
        return ReportOutputMapper.toOutput(report, pet);

    }
}