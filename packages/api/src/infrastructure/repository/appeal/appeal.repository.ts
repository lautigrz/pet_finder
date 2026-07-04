import { Appeal } from "@domain/appeal/Appeal";
import { AppealCaseContext, AppealQueueItem, AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import { AppealStatus, appealStatusMap } from "@domain/appeal/types/appeal-status";
import { AppealTargetType, appealTargetTypeMap } from "@domain/appeal/types/appeal-target-type";
import { ContentReportTargetType, contentReportTargetTypeMap } from "@domain/content-report/types/content-report-target-type";
import { contentReportReasonMapReverse } from "@domain/content-report/types/content-report-reason";
import { ReportType, ReportTypeToNumber } from "@domain/report/types/report.type";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { AppealMapper } from "./appeal.mapper";

@injectable()
export class PrismaAppealRepository implements AppealRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async save(appeal: Appeal): Promise<number> {
        const created = await this.prisma.appeal.create({ data: AppealMapper.toPersistence(appeal) });
        return created.appeal_id;
    }

    async findByPublicId(publicId: string): Promise<Appeal | null> {
        const raw = await this.prisma.appeal.findUnique({ where: { public_id: publicId } });
        return raw ? AppealMapper.toDomain(raw) : null;
    }

    async update(appeal: Appeal): Promise<void> {
        await this.prisma.appeal.update({
            where: { public_id: appeal.publicId },
            data: {
                status: { connect: { appeal_status_id: appealStatusMap[appeal.status] } },
                resolved_at: appeal.resolvedAt,
            },
        });
    }

    async existsForTarget(targetType: AppealTargetType, targetPublicId: string): Promise<boolean> {
        const count = await this.prisma.appeal.count({
            where: {
                target_type_id: appealTargetTypeMap[targetType],
                target_public_id: targetPublicId,
            },
        });
        return count > 0;
    }

    async findQueueByStatus(status: AppealStatus): Promise<AppealQueueItem[]> {
        const rows = await this.prisma.appeal.findMany({
            where: { status_id: appealStatusMap[status] },
            include: { appellant: { select: { public_id: true, username: true } } },
            orderBy: { created_at: "asc" },
        });

        const postTypeId = appealTargetTypeMap[AppealTargetType.POST];
        const postTargets = rows.filter((r) => r.target_type_id === postTypeId).map((r) => r.target_public_id);
        const accountTargets = rows.filter((r) => r.target_type_id !== postTypeId).map((r) => r.target_public_id);

        const [reports, denuncias] = await Promise.all([
            this.prisma.report.findMany({
                where: { public_id: { in: postTargets } },
                select: {
                    public_id: true,
                    report_type_id: true,
                    lost_report_detail: { select: { pet: { select: { pet_name: true } } } },
                    sighting_report_detail: { select: { pet_name: true } },
                },
            }),
            this.prisma.contentReport.findMany({
                where: {
                    OR: [
                        { target_type_id: contentReportTargetTypeMap[ContentReportTargetType.POST], target_public_id: { in: postTargets } },
                        { target_type_id: contentReportTargetTypeMap[ContentReportTargetType.USER], target_public_id: { in: accountTargets } },
                    ],
                },
                select: { target_public_id: true, reason_id: true },
            }),
        ]);

        const contentByPost = new Map(reports.map((r) => [r.public_id, {
            petName: r.lost_report_detail?.pet?.pet_name ?? r.sighting_report_detail?.pet_name ?? null,
            reportType: r.report_type_id === ReportTypeToNumber[ReportType.LOST] ? ReportType.LOST : ReportType.SIGHTING,
        }]));

        const denunciaByTarget = new Map<string, { reasonId: number; count: number }>();
        for (const denuncia of denuncias) {
            const existing = denunciaByTarget.get(denuncia.target_public_id);
            if (existing) existing.count++;
            else denunciaByTarget.set(denuncia.target_public_id, { reasonId: denuncia.reason_id, count: 1 });
        }

        return rows.map((raw) => {
            const denuncia = denunciaByTarget.get(raw.target_public_id);
            const caseContext: AppealCaseContext = {
                reportedContent: raw.target_type_id === postTypeId ? contentByPost.get(raw.target_public_id) ?? null : null,
                reason: denuncia ? contentReportReasonMapReverse[denuncia.reasonId] ?? null : null,
                reportCount: denuncia?.count ?? 0,
            };
            return {
                appeal: AppealMapper.toDomain(raw),
                appellant: { publicId: raw.appellant.public_id, username: raw.appellant.username },
                caseContext,
            };
        });
    }
}
