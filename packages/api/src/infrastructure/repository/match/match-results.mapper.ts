import { Prisma } from "@prisma/client";
import { MatchResultsEntity } from "@domain/match/entities/MatchResultsEntity";

interface PrismaMatchResult {
    match_result_id: number;
    public_id: string;
    source_report_id: number;
    candidate_report_id: number;
    score: number;
}

export class MatchResultsMapper {

    static toDomain(raw: PrismaMatchResult): MatchResultsEntity {
        return MatchResultsEntity.create({
            id: raw.match_result_id,
            publicId: raw.public_id,
            sourceReportId: raw.source_report_id,
            candidateReportId: raw.candidate_report_id,
            score: raw.score,
        });
    }
}