import { ContentReport } from "../ContentReport";
import { ContentReportStatus } from "../types/content-report-status";
import { ContentReportTargetType } from "../types/content-report-target-type";
import { ReportType } from "../../report/types/report.type";

export interface ContentReportReporter {
    publicId: string;
    username: string;
}

export interface ContentReportReportedUser {
    username: string;
}

export interface ContentReportReportedContent {
    petName: string | null;
    reportType: ReportType;
}

export interface ContentReportQueueItem {
    report: ContentReport;
    reporter: ContentReportReporter;
    reportedUser: ContentReportReportedUser | null;
    reportedContent: ContentReportReportedContent | null;
    reportCount: number;
}

export interface ContentReportRepository {

    save(report: ContentReport): Promise<number>;

    findByPublicId(publicId: string): Promise<ContentReport | null>;

    update(report: ContentReport): Promise<void>;

    findByReporterAndTarget(
        reporterUserId: number,
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<ContentReport | null>;

    countByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number>;

    flagTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<void>;

    suspendOpenByTarget(
        targetType: ContentReportTargetType,
        targetPublicId: string,
        reason: string,
    ): Promise<number>;

    approveOpenByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number>;

    suspendOpenForUser(userPublicId: string, reportPublicIds: string[], reason: string): Promise<number>;

    dismissByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<void>;

    dismissResolvedForUser(userPublicId: string, reportPublicIds: string[]): Promise<void>;

    countDistinctApprovedPublications(reportPublicIds: string[]): Promise<number>;

    findQueueByStatus(status: ContentReportStatus): Promise<ContentReportQueueItem[]>;
}
