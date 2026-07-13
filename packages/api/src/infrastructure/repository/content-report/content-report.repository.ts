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
    ): Promise<number> {
        const result = await this.prisma.contentReport.updateMany({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.PENDING],
                        contentReportStatusMap[ContentReportStatus.REVIEWED],
                        contentReportStatusMap[ContentReportStatus.DISMISSED],
                    ],
                },
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.SUSPENDED],
                suspension_reason: reason,
            },
        });
        return result.count;
    }

    async approveOpenByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<number> {
        const result = await this.prisma.contentReport.updateMany({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.PENDING],
                        contentReportStatusMap[ContentReportStatus.DISMISSED],
                    ],
                },
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.REVIEWED],
            },
        });
        return result.count;
    }

    async countDistinctApprovedPublications(reportPublicIds: string[]): Promise<number> {
        if (reportPublicIds.length === 0) return 0;
        const rows = await this.prisma.contentReport.findMany({
            where: {
                target_type_id: contentReportTargetTypeMap[ContentReportTargetType.POST],
                status_id: contentReportStatusMap[ContentReportStatus.REVIEWED],
                target_public_id: { in: reportPublicIds },
            },
            select: { target_public_id: true },
            distinct: ["target_public_id"],
        });
        return rows.length;
    }

    async suspendOpenForUser(userPublicId: string, reportPublicIds: string[], reason: string): Promise<number> {
        const result = await this.prisma.contentReport.updateMany({
            where: {
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.PENDING],
                        contentReportStatusMap[ContentReportStatus.REVIEWED],
                        contentReportStatusMap[ContentReportStatus.DISMISSED],
                    ],
                },
                OR: [
                    {
                        target_type_id: contentReportTargetTypeMap[ContentReportTargetType.USER],
                        target_public_id: userPublicId,
                    },
                    {
                        target_type_id: contentReportTargetTypeMap[ContentReportTargetType.POST],
                        target_public_id: { in: reportPublicIds },
                    },
                ],
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.SUSPENDED],
                suspension_reason: reason,
            },
        });
        return result.count;
    }

    async dismissByTarget(targetType: ContentReportTargetType, targetPublicId: string): Promise<void> {
        await this.prisma.contentReport.updateMany({
            where: {
                target_type_id: contentReportTargetTypeMap[targetType],
                target_public_id: targetPublicId,
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.REVIEWED],
                        contentReportStatusMap[ContentReportStatus.SUSPENDED],
                    ],
                },
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.DISMISSED],
                suspension_reason: null,
            },
        });
    }

    async dismissResolvedForUser(userPublicId: string, reportPublicIds: string[]): Promise<void> {
        await this.prisma.contentReport.updateMany({
            where: {
                status_id: {
                    in: [
                        contentReportStatusMap[ContentReportStatus.REVIEWED],
                        contentReportStatusMap[ContentReportStatus.SUSPENDED],
                    ],
                },
                OR: [
                    {
                        target_type_id: contentReportTargetTypeMap[ContentReportTargetType.USER],
                        target_public_id: userPublicId,
                    },
                    {
                        target_type_id: contentReportTargetTypeMap[ContentReportTargetType.POST],
                        target_public_id: { in: reportPublicIds },
                    },
                ],
            },
            data: {
                status_id: contentReportStatusMap[ContentReportStatus.DISMISSED],
                suspension_reason: null,
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
        const userTypeId = contentReportTargetTypeMap[ContentReportTargetType.USER];

        const postPublicIds = rows.filter((r) => r.target_type_id === postTypeId).map((r) => r.target_public_id);
        const chatPublicIds = rows.filter((r) => r.target_type_id === chatTypeId).map((r) => r.target_public_id);
        const userPublicIds = rows.filter((r) => r.target_type_id === userTypeId).map((r) => r.target_public_id);

        const [reports, conversations, reportedUsers, grouped] = await Promise.all([
            this.prisma.report.findMany({
                where: { public_id: { in: postPublicIds } },
                select: {
                    public_id: true,
                    report_type_id: true,
                    user: { select: { user_id: true, public_id: true, username: true, exp: true } },
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
                    user_one: { select: { user_id: true, public_id: true, username: true, exp: true } },
                    user_two: { select: { user_id: true, public_id: true, username: true, exp: true } },
                },
            }),
            this.prisma.user.findMany({
                where: { public_id: { in: userPublicIds } },
                select: { user_id: true, public_id: true, username: true, exp: true },
            }),
            this.prisma.contentReport.groupBy({
                by: ["target_type_id", "target_public_id"],
                where: { target_public_id: { in: [...postPublicIds, ...chatPublicIds, ...userPublicIds] } },
                _count: { _all: true },
            }),
        ]);

        const ownerByPostPublicId = new Map(reports.map((r) => [r.public_id, r.user]));
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
        const userByPublicId = new Map(reportedUsers.map((u) => [u.public_id, u]));
        const countByTarget = new Map(
            grouped.map((g) => [`${g.target_type_id}:${g.target_public_id}`, g._count._all]),
        );

        const resolveReportedUser = (row: (typeof rows)[number]) => {
            if (row.target_type_id === postTypeId) {
                return ownerByPostPublicId.get(row.target_public_id) ?? null;
            }
            if (row.target_type_id === userTypeId) {
                return userByPublicId.get(row.target_public_id) ?? null;
            }
            const conversation = conversationByPublicId.get(row.target_public_id);
            if (!conversation) return null;
            return conversation.user_one_id === row.reporter_user_id
                ? conversation.user_two
                : conversation.user_one;
        };

        const reportedUserByRow = rows.map(resolveReportedUser);
        const reportedUserIds = [
            ...new Set(reportedUserByRow.flatMap((u) => (u ? [u.user_id] : []))),
        ];

        const ratingGroups = reportedUserIds.length > 0
            ? await this.prisma.userReview.groupBy({
                by: ["reviewed_user_id"],
                where: { reviewed_user_id: { in: reportedUserIds }, reviewer: { is_suspended: false } },
                _avg: { rating: true },
                _count: { rating: true },
            })
            : [];
        const ratingByUserId = new Map(
            ratingGroups.map((g) => [
                g.reviewed_user_id,
                { average: g._avg.rating ? Number(g._avg.rating.toFixed(2)) : 0, count: g._count.rating },
            ]),
        );

        return rows.map((row, index) => {
            const reported = reportedUserByRow[index];
            return {
                report: ContentReportMapper.toDomain(row),
                reporter: { publicId: row.reporter.public_id, username: row.reporter.username },
                reportedUser: reported
                    ? {
                        username: reported.username,
                        publicId: reported.public_id,
                        xp: reported.exp,
                        rating: ratingByUserId.get(reported.user_id) ?? { average: 0, count: 0 },
                    }
                    : null,
                reportedContent:
                    row.target_type_id === postTypeId
                        ? contentByPostPublicId.get(row.target_public_id) ?? null
                        : null,
                reportCount: countByTarget.get(`${row.target_type_id}:${row.target_public_id}`) ?? 1,
            };
        });
    }
}
