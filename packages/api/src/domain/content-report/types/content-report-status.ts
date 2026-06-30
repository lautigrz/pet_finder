export const ContentReportStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED',
  SUSPENDED: 'SUSPENDED',
} as const

export const contentReportStatusMap: Record<ContentReportStatus, number> = {
  [ContentReportStatus.PENDING]: 1,
  [ContentReportStatus.REVIEWED]: 2,
  [ContentReportStatus.DISMISSED]: 3,
  [ContentReportStatus.SUSPENDED]: 4,
}

export const contentReportStatusMapReverse: Record<number, ContentReportStatus> = {
  [1]: ContentReportStatus.PENDING,
  [2]: ContentReportStatus.REVIEWED,
  [3]: ContentReportStatus.DISMISSED,
  [4]: ContentReportStatus.SUSPENDED,
}

export type ContentReportStatus = typeof ContentReportStatus[keyof typeof ContentReportStatus]

export const isValidContentReportStatus = (value: string): value is ContentReportStatus =>
  Object.values(ContentReportStatus).includes(value as ContentReportStatus)
