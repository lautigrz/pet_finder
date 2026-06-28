import { ContentReport } from "@domain/content-report/ContentReport";
import { contentReportReasonMap, contentReportReasonMapReverse } from "@domain/content-report/types/content-report-reason";
import { contentReportStatusMap, contentReportStatusMapReverse } from "@domain/content-report/types/content-report-status";
import { contentReportTargetTypeMap, contentReportTargetTypeMapReverse } from "@domain/content-report/types/content-report-target-type";
import { Prisma } from "@prisma/client";

type PrismaContentReport = Prisma.ContentReportGetPayload<object>;

export class ContentReportMapper {

    static toPersistence(report: ContentReport): Prisma.ContentReportCreateInput {
        return {
            public_id: report.publicId,
            target_public_id: report.targetPublicId,
            description: report.description,
            auto_flagged: report.autoFlagged,
            created_at: report.createdAt,
            reporter: { connect: { user_id: report.reporterUserId } },
            targetType: { connect: { content_report_target_type_id: contentReportTargetTypeMap[report.targetType] } },
            reason: { connect: { content_report_reason_id: contentReportReasonMap[report.reason] } },
            status: { connect: { content_report_status_id: contentReportStatusMap[report.status] } },
        };
    }

    static toDomain(raw: PrismaContentReport): ContentReport {
        return ContentReport.restore({
            contentReportId: raw.content_report_id,
            publicId: raw.public_id,
            reporterUserId: raw.reporter_user_id,
            targetType: contentReportTargetTypeMapReverse[raw.target_type_id]!,
            targetPublicId: raw.target_public_id,
            reason: contentReportReasonMapReverse[raw.reason_id]!,
            status: contentReportStatusMapReverse[raw.status_id]!,
            description: raw.description,
            autoFlagged: raw.auto_flagged,
            createdAt: raw.created_at,
        });
    }
}
