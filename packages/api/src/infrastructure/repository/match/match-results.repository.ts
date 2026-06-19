import { MatchResultsEntity } from "@domain/match/entities/MatchResultsEntity";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { PrismaClient } from "@prisma/client";
import { MatchResultsMapper } from "./match-results.mapper";


export class PrismaMatchResultsRepository implements MatchResultsRepository {

    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: number): Promise<MatchResultsEntity | null> {
        const result = await this.prisma.matchResult.findUnique({
            where: { match_result_id: id }
        });

        return result ? MatchResultsMapper.toDomain(result) : null;
    }
    async findResultsBySourceReportId(sourceReportId: number): Promise<MatchResultsEntity[]> {

        const results = await this.prisma.matchResult.findMany({
            where: { source_report_id: sourceReportId },
            orderBy: { score: 'desc' },
            take: 10
        });

        return results.map((result) => MatchResultsMapper.toDomain(result));
    }
}