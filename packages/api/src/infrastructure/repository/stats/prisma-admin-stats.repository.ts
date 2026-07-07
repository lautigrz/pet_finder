import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import {
  AdminStatsRepository,
  MonthlyReportCount,
  ReunionCounts,
} from "@domain/stats/repositories/admin-stats.repository";

@injectable()
export class PrismaAdminStatsRepository implements AdminStatsRepository {
  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient,
  ) {}

  async reportsByMonth(): Promise<MonthlyReportCount[]> {
    return this.prisma.$queryRaw<MonthlyReportCount[]>`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
             COUNT(*) FILTER (WHERE report_type_id = 1)::int AS lost,
             COUNT(*) FILTER (WHERE report_type_id = 2)::int AS sighting
      FROM reports
      WHERE date_trunc('year', created_at) = date_trunc('year', now())
      GROUP BY 1
      ORDER BY 1
    `;
  }

  async reunionCounts(): Promise<ReunionCounts> {
    const [total, reunited] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { resolved: true } }),
    ]);
    return { total, reunited };
  }

  async averageResolutionDays(): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ avg_days: number | null }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400)::float AS avg_days
      FROM reports
      WHERE resolved = true AND resolved_at IS NOT NULL
    `;
    return rows[0]?.avg_days ?? null;
  }
}
