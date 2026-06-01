import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository, ReportWithPet } from "@domain/report/repositories/report.repository";
import { Page, PaginationParams } from "@domain/shared/pagination/pagination";

import { ReportMapper } from "./report.mapper";
import { Prisma, PrismaClient } from "@prisma/client";
import { ReportQuery } from "@application/usecase/report/ReportQuery";
import { PetMapper } from "../pet/pet.mapper";
import { ReportStatus, reportStatusMap } from "@domain/report/types/report.status";


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

    async findByPublicId(publicId: string): Promise<Report | null> {
        const raw = await this.prisma.report.findUnique(
            {
                where: { public_id: publicId },
                include: reportInclude,
            }
        )

        if (!raw) {
            return null
        }
        return ReportMapper.toDomain(raw)
    }


    async save(report: Report): Promise<void> {

        const data = ReportMapper.toPersistence(report)

        await this.prisma.report.create({ data })

    }

    async update(report: Report): Promise<void> {
        if (!report.idReport) {
            throw new Error("Report ID is required");
        }

        await this.prisma.report.update({
            where: {
                report_id: report.idReport
            },
            data: {
                report_status_id: reportStatusMap[report.status],
                updated_at: report.updatedAt
            }
        });

    }



    async findDetailByPublicId(publicId: string): Promise<ReportWithPet | null> {

        const raw = await this.prisma.report.findUnique(
            {
                where: { public_id: publicId },
                include: {
                    user: {
                        select: { user_id: true, public_id: true }
                    },
                    sighting_report_detail: true,
                    lost_report_detail: {
                        include: {
                            pet: {
                                include: { animal_type: true, gender: true, size: true, petImages: true }
                            }
                        }
                    },
                    reportImages: true
                }
            })

        if (!raw) {
            return null
        }
        return {
            report: ReportMapper.toDomain(raw),
            pet: raw.lost_report_detail?.pet
                ? PetMapper.toDomain(raw.lost_report_detail.pet)
                : undefined
        };

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

    async findIdsByQuery(query: ReportQuery): Promise<string[]> {

        const where: Prisma.ReportWhereInput = {}

        if (query.status) {
            where.reportStatus = { name: query.status }
        }

        if (query.reportType) {
            where.reportType = { name: query.reportType }
        }

        if (query.createdFrom || query.createdTo) {
            where.created_at = {
                ...(query.createdFrom && { gte: query.createdFrom }),
                ...(query.createdTo && { lte: query.createdTo })
            }
        }

        if (query.animalType) {
            where.OR = [
                {
                    sighting_report_detail: {
                        animal_type: {
                            name: query.animalType
                        }
                    }
                },
                {
                    lost_report_detail: {
                        pet: {
                            animal_type: {
                                name: query.animalType
                            }
                        }
                    }
                }
            ]
        }

        const reports = await this.prisma.report.findMany({
            where,
            select: { public_id: true }
        })

        return reports.map(r => r.public_id)

    }
    async findByIds(ids: string[]): Promise<ReportWithPet[]> {
        if (ids.length === 0) return [];

        const rows = await this.prisma.report.findMany({
            where: { public_id: { in: ids } },
            include: {
                user: {
                    select: { user_id: true, public_id: true }
                },
                reportType: true,
                reportStatus: true,
                reportImages: true,
                sighting_report_detail: {
                    include: { animal_type: true }
                },
                lost_report_detail: {
                    include: {
                        pet: {
                            include: { animal_type: true, gender: true, size: true, petImages: true }
                        }
                    }
                }
            }
        })

        return rows.map((row) => ({
            report: ReportMapper.toDomain(row),
            pet: row.lost_report_detail?.pet
                ? PetMapper.toDomain(row.lost_report_detail.pet)
                : undefined
        }));

    }

}
