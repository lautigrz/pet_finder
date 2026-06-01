import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportQuery } from "./ReportQuery";
import { GetFilteredReportsDTO } from "./dto/get-filtered-reports.dto";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportOutput } from "./get-report-usecase";

export class GetFilteredReportsUseCase {

    constructor(private reportRepository: ReportRepository) { }

    async execute(dto: GetFilteredReportsDTO): Promise<ReportOutput[]> {
        const query = new ReportQuery(dto);

        const ids = await this.reportRepository.findIdsByQuery(query);

        if (ids.length === 0) return [];

        const results = await this.reportRepository.findByIds(ids);
        return results.map(({ report, pet }) =>
            ReportOutputMapper.toOutput(report, pet)
        );

    }

}