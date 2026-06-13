import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository, ReportWithPet } from "@domain/report/repositories/report.repository";
import { ReportMapper } from "./report.mapper";
import { Prisma, PrismaClient } from "@prisma/client";
import { ReportQuery } from "@application/usecase/report/report-query";
import { PetMapper } from "../pet/pet.mapper";
import { reportStatusMap } from "@domain/report/types/report.status";
import { ReportType } from '@domain/report/types/report.type';
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo';
import { AnimalTypeMap } from '@domain/shared/animal-type/animal-type-map';
import { GenderTypeMap } from '@domain/shared/gender-type/gender-map';
import { SizeTypeMap } from '@domain/shared/size-type/size-map';
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { CatalogResolver } from "../catalog/catalog-resolver";


const reportInclude = {
    user: {
        select: { user_id: true, public_id: true }
    },
    sighting_report_detail: { include: { color: true, breed: true } },
    lost_report_detail: true,
    reportImages: true,
} satisfies Prisma.ReportInclude

export class PrismaReportRepository implements ReportRepository {
    private readonly catalog: CatalogResolver;

    constructor(private readonly prisma: PrismaClient) {
        this.catalog = new CatalogResolver(prisma);
    }

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


    async save(report: Report, images?: SightingImage[]): Promise<void> {
        let colorId: number | undefined;
        let breedId: number | null | undefined;
        if (report.reportType === ReportType.SIGHTING) {
            const details = report.details as SightingReportDetails;
            colorId = await this.catalog.colorId(details.color);
            breedId = await this.catalog.breedId(details.breed, details.animalType);
        }
        const data = ReportMapper.toPersistence(report, colorId, breedId);

        await this.prisma.$transaction(async (tx) => {
            const created = await tx.report.create({ data });

            if (images && images.length > 0) {
                await tx.reportImage.createMany({
                    data: images.map(img => ({
                        reportId: created.report_id,
                        cloudinaryId: img.cloudinaryId,
                        photoUrl: img.photoUrl,
                    })),
                });
            }
        });
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

    async updateFields(report: Report, images?: SightingImage[]): Promise<void> {
        if (!report.idReport) throw new Error('Report ID is required');

        const isSighting = report.reportType === ReportType.SIGHTING;
        const details = isSighting ? report.details as SightingReportDetails : null;

        const colorId = details ? await this.catalog.colorId(details.color) : undefined;
        const breedId = details ? await this.catalog.breedId(details.breed, details.animalType) : undefined;

        await this.prisma.$transaction([

            this.prisma.report.update({
                where: { report_id: report.idReport },
                data: {
                    description: report.description?.value ?? null,
                    occurred_at: report.occurredAt,
                    location_address: report.location.address,
                    location_lat: report.location.latitude,
                    location_lng: report.location.longitude,
                    updated_at: report.updatedAt,
                    ...(isSighting && details ? {
                        sighting_report_detail: {
                            update: {
                                pet_name: details.petName ?? null,
                                color: { connect: { color_id: colorId! } },
                                ...(breedId !== null && breedId !== undefined
                                    ? { breed: { connect: { breed_id: breedId } } }
                                    : { breed: { disconnect: true } }),
                                has_id_collar: details.hasIdCollar,
                                is_in_transit: details.isInTransit,
                                animal_type: { connect: { animal_type_id: AnimalTypeMap[details.animalType] } },
                                ...(details.genderType
                                    ? { gender: { connect: { gender_id: GenderTypeMap[details.genderType] } } }
                                    : { gender: { disconnect: true } }),
                                ...(details.sizeType
                                    ? { size: { connect: { size_id: SizeTypeMap[details.sizeType] } } }
                                    : { size: { disconnect: true } }),
                            }
                        }
                    } : {}),
                },
            }),

            this.prisma.reportImage.deleteMany({
                where: { reportId: report.idReport },
            }),

            ...((images ?? []).length > 0
                ? [this.prisma.reportImage.createMany({
                    data: (images ?? []).map(img => ({
                        reportId: report.idReport!,
                        cloudinaryId: img.cloudinaryId,
                        photoUrl: img.photoUrl,
                    })),
                })]
                : []),
        ]);
    }


    async findImagesByReportId(publicId: string): Promise<SightingImage[]> {
        const raw = await this.prisma.report.findUnique({
            where: { public_id: publicId },
            select: { reportImages: true },
        });
        return (raw?.reportImages ?? []).map(img =>
            SightingImage.create({ cloudinaryId: img.cloudinaryId, photoUrl: img.photoUrl })
        );
    }

    async findDetailByPublicId(publicId: string): Promise<ReportWithPet | null> {

        const raw = await this.prisma.report.findUnique(
            {
                where: { public_id: publicId },
                include: {
                    user: {
                        select: { user_id: true, public_id: true }
                    },
                    sighting_report_detail: { include: { color: true, breed: true } },
                    lost_report_detail: {
                        include: {
                            pet: {
                                include: { animal_type: true, gender: true, size: true, petImages: true, color: true, breed: true }
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
                : undefined,
        };

    }


    async findByUserPublicId(userPublicId: string, filters?: { reportType?: string; animalType?: string; createdFrom?: string; createdTo?: string; q?: string; }): Promise<Report[]> {

        const where: Prisma.ReportWhereInput = { user: { public_id: userPublicId } }

        if (filters?.q) {
            const matchingDescriptionIds =
                await this.findIdsByDescriptionQuery(filters.q);

            if (matchingDescriptionIds.length === 0) {
                return [];
            }

            where.public_id = {
                in: matchingDescriptionIds,
            };
        }
        
        if (filters?.reportType) {
            where.reportType = { name: filters.reportType }
        }

        if (filters?.animalType) {
            where.OR = [
                { sighting_report_detail: { animal_type: { name: filters.animalType } } },
                { lost_report_detail: { pet: { animal_type: { name: filters.animalType } } } }
            ]
        }

        if (filters?.createdFrom || filters?.createdTo) {
            where.created_at = {
                ...(filters.createdFrom && { gte: new Date(`${filters.createdFrom}T00:00:00.000Z`) }),
                ...(filters.createdTo && { lte: new Date(`${filters.createdTo}T23:59:59.999Z`) })
            }
        }

        const rows = await this.prisma.report.findMany({
            where,
            include: reportInclude,
            orderBy: { created_at: "desc" },
        })

        return rows.map(ReportMapper.toDomain)

    }

    async findIdsByQuery(query: ReportQuery): Promise<string[]> {

        const where: Prisma.ReportWhereInput = {}

        if (query.q) {
            const matchingDescriptionIds = await this.findIdsByDescriptionQuery(query.q);
            if (matchingDescriptionIds.length === 0) {
                return [];
            }

            where.public_id = {
                in: matchingDescriptionIds
            };
        }

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

        if (query.userPublicId) {
            where.user = { public_id: query.userPublicId }
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
                    include: { animal_type: true, color: true, breed: true }
                },
                lost_report_detail: {
                    include: {
                        pet: {
                            include: { animal_type: true, gender: true, size: true, petImages: true, color: true, breed: true }
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

    private async findIdsByDescriptionQuery(queryText: string,): Promise<string[]> {
        const searchText = queryText.trim();

        const rows = await this.prisma.$queryRaw<Array<{ public_id: string }>>(
            Prisma.sql`
                SELECT
                    r."public_id"::text AS "public_id"
                FROM "reports" r
                WHERE
                    r."description" IS NOT NULL
                    AND (
                    r."description" ILIKE ${`%${searchText}%`}
                    OR word_similarity(${searchText}, r."description") >= 0.3
                    )
                ORDER BY GREATEST(
                    similarity(r."description", ${searchText}),
                    word_similarity(${searchText}, r."description")
                ) DESC
            `,
        );

        return rows.map((row) => row.public_id);
    }

}
