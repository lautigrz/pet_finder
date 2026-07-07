export interface MonthlyReportCount {
  month: string; // 'YYYY-MM'
  lost: number;
  sighting: number;
}

export interface ReunionCounts {
  total: number;
  reunited: number;
}

export interface AdminStatsRepository {
  reportsByMonth(): Promise<MonthlyReportCount[]>;
  reunionCounts(): Promise<ReunionCounts>;
  averageResolutionDays(): Promise<number | null>;
}
