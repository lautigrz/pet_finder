export const ReportStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const

export const reportStatusMap: Record<ReportStatus, number> = {
  [ReportStatus.ACTIVE]: 1,
  [ReportStatus.RESOLVED]: 2,
  [ReportStatus.CLOSED]: 3,
}

export const reportStatusMapReverse: Record<number, ReportStatus> = {
  [1]: ReportStatus.ACTIVE,
  [2]: ReportStatus.RESOLVED,
  [3]: ReportStatus.CLOSED,
}

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus]

export const isValidReportStatus = (value: string): value is ReportStatus =>
  Object.values(ReportStatus).includes(value as ReportStatus)