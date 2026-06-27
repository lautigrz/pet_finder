import { ContentReport } from "../ContentReport";
import { ContentReportStatus } from "../types/content-report-status";
import { ContentReportTargetType } from "../types/content-report-target-type";

export interface ContentReportReporter {
    publicId: string;
    username: string;
}

export interface ContentReportReportedUser {
    username: string;
}

export interface ContentReportQueueItem {
    report: ContentReport;
    reporter: ContentReportReporter;
    reportedUser: ContentReportReportedUser | null;
    reportCount: number;
}

export interface ContentReportRepository {

    save(report: ContentReport): Promise<number>;

    findByReporterAndTarget(
        reporterUserId: number,
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<ContentReport | null>;

    countByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number>;

    flagTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<void>;

    findQueueByStatus(status: ContentReportStatus): Promise<ContentReportQueueItem[]>;
}
