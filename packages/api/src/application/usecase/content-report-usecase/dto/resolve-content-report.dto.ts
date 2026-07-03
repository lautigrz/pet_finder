import { ContentReportStatus } from "@domain/content-report/types/content-report-status";

export interface ResolveContentReportDTO {
    publicId: string;
    status: ContentReportStatus;
    suspensionReason?: string;
}
