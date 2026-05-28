import { Report } from "@domain/report/aggregates/report.aggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";

import { ReportMapper } from "./report.mapper";
import { PrismaClient } from "@prisma/client";

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
                }
            })
        if (!raw) {
            return null
        }
        return ReportMapper.toDomain(raw)

    }




}