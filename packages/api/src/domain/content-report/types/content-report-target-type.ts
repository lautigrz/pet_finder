export const ContentReportTargetType = {
  CHAT: 'CHAT',
  POST: 'POST',
  USER: 'USER',
} as const

export const contentReportTargetTypeMap: Record<ContentReportTargetType, number> = {
  [ContentReportTargetType.CHAT]: 1,
  [ContentReportTargetType.POST]: 2,
  [ContentReportTargetType.USER]: 3,
}

export const contentReportTargetTypeMapReverse: Record<number, ContentReportTargetType> = {
  [1]: ContentReportTargetType.CHAT,
  [2]: ContentReportTargetType.POST,
  [3]: ContentReportTargetType.USER,
}

export type ContentReportTargetType = typeof ContentReportTargetType[keyof typeof ContentReportTargetType]

export const isValidContentReportTargetType = (value: string): value is ContentReportTargetType =>
  Object.values(ContentReportTargetType).includes(value as ContentReportTargetType)
