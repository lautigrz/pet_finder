import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { MatchResultMapper } from "./mapper/match-result.mapper";
import { MatchResultDetailDTO } from "./dto/match-result.dto";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";


export class GetMatchResultsUseCase {
    constructor(
        private readonly matchResultsRepository: MatchResultsRepository,
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