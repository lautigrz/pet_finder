import { Report } from "@domain/report/aggregates/report.aggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";

import { ReportMapper } from "./report.mapper";
import { PrismaClient } from "@prisma/client";

export class IReportRepository implements ReportRepository {
    constructor(private readonly prisma: PrismaClient) {}
    async save(report: Report): Promise<void> {
        
        const data = ReportMapper.toPersistence(report)

        await this.prisma.report.create({ data })
    
    }
    findByPublicId(publicId: string): Promise<Report | null> {
        throw new Error("Method not implemented.");
    }
 



}