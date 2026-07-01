import { ContentReportTargetType } from "./content-report-target-type";

export const ContentReportReason = {
  SUSPICIOUS_BEHAVIOR: 'SUSPICIOUS_BEHAVIOR',
  FRAUD_OR_SCAM: 'FRAUD_OR_SCAM',
  IMPERSONATION: 'IMPERSONATION',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  PERSONAL_DATA_EXPOSED: 'PERSONAL_DATA_EXPOSED',
  FALSE_INFORMATION: 'FALSE_INFORMATION',
  SPAM: 'SPAM',
  DUPLICATE_REPORT: 'DUPLICATE_REPORT',
  OTHER: 'OTHER',
} as const

export const contentReportReasonMap: Record<ContentReportReason, number> = {
  [ContentReportReason.SUSPICIOUS_BEHAVIOR]: 1,
  [ContentReportReason.FRAUD_OR_SCAM]: 2,
  [ContentReportReason.IMPERSONATION]: 3,
  [ContentReportReason.INAPPROPRIATE_CONTENT]: 4,
  [ContentReportReason.PERSONAL_DATA_EXPOSED]: 5,
  [ContentReportReason.FALSE_INFORMATION]: 6,
  [ContentReportReason.SPAM]: 7,
  [ContentReportReason.DUPLICATE_REPORT]: 8,
  [ContentReportReason.OTHER]: 9,
}

export const contentReportReasonMapReverse: Record<number, ContentReportReason> = {
  [1]: ContentReportReason.SUSPICIOUS_BEHAVIOR,
  [2]: ContentReportReason.FRAUD_OR_SCAM,
  [3]: ContentReportReason.IMPERSONATION,
  [4]: ContentReportReason.INAPPROPRIATE_CONTENT,
  [5]: ContentReportReason.PERSONAL_DATA_EXPOSED,
  [6]: ContentReportReason.FALSE_INFORMATION,
  [7]: ContentReportReason.SPAM,
  [8]: ContentReportReason.DUPLICATE_REPORT,
  [9]: ContentReportReason.OTHER,
}

export type ContentReportReason = typeof ContentReportReason[keyof typeof ContentReportReason]

export const contentReportReasonsByTarget: Record<ContentReportTargetType, ContentReportReason[]> = {
  [ContentReportTargetType.CHAT]: [
    ContentReportReason.SUSPICIOUS_BEHAVIOR,
    ContentReportReason.FRAUD_OR_SCAM,
    ContentReportReason.IMPERSONATION,
    ContentReportReason.INAPPROPRIATE_CONTENT,
    ContentReportReason.PERSONAL_DATA_EXPOSED,
    ContentReportReason.OTHER,
  ],
  [ContentReportTargetType.POST]: [
    ContentReportReason.FALSE_INFORMATION,
    ContentReportReason.INAPPROPRIATE_CONTENT,
    ContentReportReason.SPAM,
    ContentReportReason.DUPLICATE_REPORT,
    ContentReportReason.OTHER,
  ],
  [ContentReportTargetType.USER]: [
    ContentReportReason.SUSPICIOUS_BEHAVIOR,
    ContentReportReason.FRAUD_OR_SCAM,
    ContentReportReason.IMPERSONATION,
    ContentReportReason.INAPPROPRIATE_CONTENT,
    ContentReportReason.PERSONAL_DATA_EXPOSED,
    ContentReportReason.SPAM,
    ContentReportReason.OTHER,
  ],
}

export const isValidContentReportReason = (value: string): value is ContentReportReason =>
  Object.values(ContentReportReason).includes(value as ContentReportReason)

export const isReasonValidForTarget = (
  reason: ContentReportReason,
  targetType: ContentReportTargetType,
): boolean => contentReportReasonsByTarget[targetType].includes(reason)
