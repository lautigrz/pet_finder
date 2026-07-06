import { inject, injectable } from "tsyringe";
import type { AdminStatsRepository } from "@domain/stats/repositories/admin-stats.repository";
import { AdminStatsOutput, MonthlyReportsOutput } from "./dto/admin-stats.output";

@injectable()
export class GetAdminStatsUseCase {
  constructor(
    @inject("AdminStatsRepository")
    private readonly statsRepository: AdminStatsRepository,
  ) {}

  async execute(): Promise<AdminStatsOutput> {
    const [monthly, counts, avgDays] = await Promise.all([
      this.statsRepository.reportsByMonth(),
      this.statsRepository.reunionCounts(),
      this.statsRepository.averageResolutionDays(),
    ]);

    const rate =
      counts.total === 0 ? 0 : this.round((counts.reunited / counts.total) * 100);

    return {
      reportsByMonth: this.fillCurrentYear(monthly),
      reunionRate: {
        total: counts.total,
        reunited: counts.reunited,
        rate,
      },
      avgResolutionDays: avgDays === null ? null : this.round(avgDays),
    };
  }

  private fillCurrentYear(rows: MonthlyReportsOutput[]): MonthlyReportsOutput[] {
    const byMonth = new Map(rows.map((r) => [r.month, r]));
    const year = new Date().getFullYear();
    const result: MonthlyReportsOutput[] = [];

    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      result.push(byMonth.get(key) ?? { month: key, lost: 0, sighting: 0 });
    }

    return result;
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
