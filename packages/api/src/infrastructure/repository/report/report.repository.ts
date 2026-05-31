import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { Page, PaginationParams } from "@domain/shared/pagination/pagination";

import { ReportMapper } from "./report.mapper";
import { Prisma, PrismaClient } from "@prisma/client";

const reportInclude = {
    user: {
        select: { user_id: true, public_id: true }
    },
    sighting_report_detail: true,
    lost_report_detail: true,
    reportImages: true,
} satisfies Prisma.ReportInclude

export class PrismaReportRepository implements ReportRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async save(report: Report): Promise<void> {

        const data = ReportMapper.toPersistence(report)

        await this.prisma.report.create({ data })

    }



    async findByPublicId(publicId: string): Promise<Report | null> {

        const raw = await this.prisma.report.findUnique(
            {
                where: { public_id: publicId },
                include: {
                    user: {
                        select: { user_id: true, public_id: true }
                    },
                    sighting_report_detail: true,
                    lost_report_detail: true,
                    reportImages: true
                }
            })

        if (!raw) {
            return null
        }
        return ReportMapper.toDomain(raw)

    }


    async findByUserPublicId(userPublicId: string, pagination: PaginationParams): Promise<Page<Report>> {

        const where: Prisma.ReportWhereInput = { user: { public_id: userPublicId } }

        const [rows, total] = await Promise.all([
            this.prisma.report.findMany({
                where,
                include: reportInclude,
                orderBy: { created_at: "desc" },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
            }),
            this.prisma.report.count({ where }),
        ])

        return { items: rows.map(ReportMapper.toDomain), total }

    }

}
