export const ReportType = {
  LOST: 'LOST',
  SIGHTING: 'SIGHTING'
} as const

export type ReportType = typeof ReportType[keyof typeof ReportType]

export const isValidReportType = (value: string): value is ReportType =>
  Object.values(ReportType).includes(value as ReportType)