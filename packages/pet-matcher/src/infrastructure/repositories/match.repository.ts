
import { IMatchRepository, MatchResultRaw } from "@domain/repositories/match.repository";
import { PrismaClient } from "@prisma/client";



export class MatchRepository implements IMatchRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findMatchResults(sourceReportId: number): Promise<MatchResultRaw[]> {
    const rows = await this.prisma.$queryRaw<MatchResultRaw[]>`
  SELECT
    source_report_id,
    candidate_report_id,
    score
  FROM match_results
  WHERE source_report_id = ${sourceReportId} OR candidate_report_id = ${sourceReportId}
`;

    return rows;
  }
}