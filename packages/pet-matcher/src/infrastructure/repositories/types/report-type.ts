export const ReportType = {
    LOST: 1,
    FOUND: 2
} as const;

export type ReportType = typeof ReportType[keyof typeof ReportType];