export const ReportType = {
  LOST: 'lost',
  SIGHTING: 'sighting'
} as const

export type ReportType = typeof ReportType[keyof typeof ReportType]