import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";

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
    } | null;
    reporter: {
        publicId: string;
        username: string;
    };
}
