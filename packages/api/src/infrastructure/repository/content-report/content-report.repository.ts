import { ContentReport } from "@domain/content-report/ContentReport";
import { ContentReportQueueItem, ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportStatus, contentReportStatusMap } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType, contentReportTargetTypeMap } from "@domain/content-report/types/content-report-target-type";
import { ReportType, ReportTypeToNumber } from "@domain/report/types/report.type";
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

    async findByPublicId(publicId: string): Promise<ContentReport | null> {
        const raw = await this.prisma.contentReport.findUnique({
            where: { public_id: publicId },
        });
        return raw ? ContentReportMapper.toDomain(raw) : null;
    }

    async update(report: ContentReport): Promise<void> {
        await this.prisma.contentReport.update({
            where: { public_id: report.publicId },
            data: {
                status: { connect: { content_report_status_id: contentReportStatusMap[report.status] } },
                suspension_reason: report.suspensionReason,
            },
        });
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

    async countApprovedByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number> {
        return this.prisma.contentReport.count({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
                status_id: contentReportStatusMap[ContentReportStatus.REVIEWED],
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

    async suspendOpenByTarget(
        targetType: ContentReportTargetType,
        targetPublicId: string,
        reason: string,
    ): Promise<void> {
        await this.prisma.contentReport.updateMany({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.PENDING],
                        contentReportStatusMap[ContentReportStatus.REVIEWED],
                    ],
                },
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.SUSPENDED],
                suspension_reason: reason,
            },
        });
    }

    async findQueueByStatus(status: ContentReportStatus): Promise<ContentReportQueueItem[]> {
        const rows = await this.prisma.contentReport.findMany({
            where: { status_id: contentReportStatusMap[status] },
            include: { reporter: { select: { public_id: true, username: true } } },
            orderBy: [{ auto_flagged: "desc" }, { created_at: "asc" }],
        });

        const postTypeId = contentReportTargetTypeMap[ContentReportTargetType.POST];
        const chatTypeId = contentReportTargetTypeMap[ContentReportTargetType.CHAT];

        const postPublicIds = rows.filter((r) => r.target_type_id === postTypeId).map((r) => r.target_public_id);
        const chatPublicIds = rows.filter((r) => r.target_type_id === chatTypeId).map((r) => r.target_public_id);

        const [reports, conversations, grouped] = await Promise.all([
            this.prisma.report.findMany({
                where: { public_id: { in: postPublicIds } },
                select: {
                    public_id: true,
                    report_type_id: true,
                    user: { select: { username: true } },
                    lost_report_detail: { select: { pet: { select: { pet_name: true } } } },
                    sighting_report_detail: { select: { pet_name: true } },
                },
            }),
            this.prisma.conversation.findMany({
                where: { public_id: { in: chatPublicIds } },
                select: {
                    public_id: true,
                    user_one_id: true,
                    user_two_id: true,
                    user_one: { select: { username: true } },
                    user_two: { select: { username: true } },
                },
            }),
            this.prisma.contentReport.groupBy({
                by: ["target_type_id", "target_public_id"],
                where: { target_public_id: { in: [...postPublicIds, ...chatPublicIds] } },
                _count: { _all: true },
            }),
        ]);

        const ownerByPostPublicId = new Map(reports.map((r) => [r.public_id, r.user.username]));
        const contentByPostPublicId = new Map(
            reports.map((r) => [
                r.public_id,
                {
                    petName: r.lost_report_detail?.pet?.pet_name ?? r.sighting_report_detail?.pet_name ?? null,
                    reportType:
                        r.report_type_id === ReportTypeToNumber[ReportType.LOST]
                            ? ReportType.LOST
                            : ReportType.SIGHTING,
                },
            ]),
        );
        const conversationByPublicId = new Map(conversations.map((c) => [c.public_id, c]));
        const countByTarget = new Map(
            grouped.map((g) => [`${g.target_type_id}:${g.target_public_id}`, g._count._all]),
        );

        return rows.map((row) => {
            let reportedUsername: string | null = null;
            if (row.target_type_id === postTypeId) {
                reportedUsername = ownerByPostPublicId.get(row.target_public_id) ?? null;
            } else {
                const conversation = conversationByPublicId.get(row.target_public_id);
                if (conversation) {
                    reportedUsername =
                        conversation.user_one_id === row.reporter_user_id
                            ? conversation.user_two.username
                            : conversation.user_one.username;
                }
            }

            return {
                report: ContentReportMapper.toDomain(row),
                reporter: { publicId: row.reporter.public_id, username: row.reporter.username },
                reportedUser: reportedUsername ? { username: reportedUsername } : null,
                reportedContent:
                    row.target_type_id === postTypeId
                        ? contentByPostPublicId.get(row.target_public_id) ?? null
                        : null,
                reportCount: countByTarget.get(`${row.target_type_id}:${row.target_public_id}`) ?? 1,
            };
        });
    }
}
