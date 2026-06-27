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
    autoFlagged: boolean;
    createdAt: Date;
    reporter: {
        publicId: string;
        username: string;
    };
}
