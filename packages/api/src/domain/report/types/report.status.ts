export const ReportStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus]

export const isValidReportStatus = (value: string): value is ReportStatus =>
  Object.values(ReportStatus).includes(value as ReportStatus)