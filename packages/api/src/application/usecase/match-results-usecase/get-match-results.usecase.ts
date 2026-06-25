import type { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { MatchResultMapper } from "./mapper/match-result.mapper";
import { MatchResultDetailDTO } from "./dto/match-result.dto";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { injectable, inject } from "tsyringe";

@injectable()
export class GetMatchResultsUseCase {
    constructor(
        @inject("MatchResultsRepository")
        private readonly matchResultsRepository: MatchResultsRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
    ) { }

    async execute(public_id: string): Promise<MatchResultDetailDTO[]> {
        const reportSource = await this.reportRepository.findByPublicId(public_id);
        if (!reportSource) {
            throw new ReportNotFoundError("Report not found");
        }
        if (reportSource.idReport === null) {
            throw new ReportNotFoundError(public_id);
        }
        const candidatesIds = await this.matchResultsRepository.findResultsBySourceReportId(reportSource.idReport);
        if (!candidatesIds) {
            return [];
        }

        const ids = candidatesIds.map(r => r.candidateReportId);
        const matchResults = await this.reportRepository.findDetailsByIds(ids)

        const detailsByReportId = new Map(
            matchResults.map(({ report, pet }) => [report.idReport, { report, pet }])
        );

        const results = candidatesIds
            .map((match) => {
                const details = detailsByReportId.get(match.candidateReportId);
                if (!details) return null;

                const detailsReportDTO = MatchResultMapper.toDetailsReportDTO(details.report, details.pet);
                if (!detailsReportDTO) return null;

                return {
                    publicId: match.publicId,
                    sourceReportPublicId: reportSource.publicId,
                    score: match.score,
                    details: detailsReportDTO,
                } satisfies MatchResultDetailDTO;
            })
            .filter((item): item is MatchResultDetailDTO => item !== null);

        return results;
    }
}