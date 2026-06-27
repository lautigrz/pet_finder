import { ContentReport } from "@domain/content-report/ContentReport";
import { ContentReportQueueItem, ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportStatus, contentReportStatusMap } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType, contentReportTargetTypeMap } from "@domain/content-report/types/content-report-target-type";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { ContentReportMapper } from "./content-report.mapper";

@injectable()
export class PrismaContentReportRepository implements ContentReportRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async save(report: ContentReport): Promise<number> {
        const data = ContentReportMapper.toPersistence(report);
        const created = await this.prisma.contentReport.create({ data });
        return created.content_report_id;
    }

    async findByReporterAndTarget(
        reporterUserId: number,
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<ContentReport | null> {
        const raw = await this.prisma.contentReport.findUnique({
            where: {
                reporter_user_id_target_type_id_target_public_id: {
                    reporter_user_id: reporterUserId,
                    target_type_id: contentReportTargetTypeMap[targetType],
                    target_public_id: targetPublicId,
                },
            },
        });
        return raw ? ContentReportMapper.toDomain(raw) : null;
    }

    async countByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number> {
        return this.prisma.contentReport.count({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
            },
        });
    }

    async flagTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<void> {
        await this.prisma.contentReport.updateMany({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
            },
            data: { auto_flagged: true },
        });
    }

    async findQueueByStatus(status: ContentReportStatus): Promise<ContentReportQueueItem[]> {
        const rows = await this.prisma.contentReport.findMany({
            where: { status_id: contentReportStatusMap[status] },
            include: { reporter: { select: { public_id: true, username: true } } },
            orderBy: [{ auto_flagged: "desc" }, { created_at: "asc" }],
        });

        return rows.map((row) => ({
            report: ContentReportMapper.toDomain(row),
            reporter: { publicId: row.reporter.public_id, username: row.reporter.username },
        }));
    }
}
