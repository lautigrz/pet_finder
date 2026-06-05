import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportQuery } from "./report-query";
import { GetFilteredReportsDTO } from "./dto/get-filtered-reports.dto";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportOutput } from "./get-report-usecase";
import { ReportType } from "@domain/report/types/report.type";

export class GetFilteredReportsUseCase {

    constructor(private reportRepository: ReportRepository) { }

    async execute(dto: GetFilteredReportsDTO): Promise<ReportOutput[]> {
        const query = new ReportQuery(dto);

        const ids = await this.reportRepository.findIdsByQuery(query);

        if (ids.length === 0) return [];

        const results = await this.reportRepository.findByIds(ids);

        const outputs = await Promise.all(
            results.map(async ({ report, pet }) => {
                const reportImages = await this.reportRepository.findImagesByReportId(report.publicId);
                return ReportOutputMapper.toOutput(report, pet, undefined, reportImages);
            })
        );
        return outputs;

    }

}