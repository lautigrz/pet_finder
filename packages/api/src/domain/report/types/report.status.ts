export const ReportStatus = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus]
// equivale a: type ReportStatus = 'pending' | 'resolved' | 'closed'