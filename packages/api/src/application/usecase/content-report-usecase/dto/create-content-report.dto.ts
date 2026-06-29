import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";

export interface CreateContentReportDTO {
    targetType: ContentReportTargetType;
    targetPublicId: string;
    reason: ContentReportReason;
    description: string | null;
}
