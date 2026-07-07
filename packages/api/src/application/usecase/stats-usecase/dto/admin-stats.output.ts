export interface MonthlyReportsOutput {
  month: string; // 'YYYY-MM'
  lost: number;
  sighting: number;
}

export interface AdminStatsOutput {
  reportsByMonth: MonthlyReportsOutput[];
  reunionRate: {
    total: number;
    reunited: number;
    rate: number; // porcentaje 0-100
  };
  avgResolutionDays: number | null;
}
