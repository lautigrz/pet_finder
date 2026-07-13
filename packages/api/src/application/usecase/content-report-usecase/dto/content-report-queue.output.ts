import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ReportType } from "@domain/report/types/report.type";

export interface ContentReportQueueItemOutput {
    publicId: string;
    targetType: ContentReportTargetType;
    targetPublicId: string;
    reason: ContentReportReason;
    status: ContentReportStatus;
    description: string | null;
    suspensionReason: string | null;
    autoFlagged: boolean;
    createdAt: Date;
    reportCount: number;
    reportedUser: {
        username: string;
        publicId: string;
        xp: number;
        level: number;
        rating: {
            average: number;
            count: number;
        };
    } | null;
    reportedContent: {
        petName: string | null;
        reportType: ReportType;
    } | null;
    reporter: {
        publicId: string;
        username: string;
    };
}
