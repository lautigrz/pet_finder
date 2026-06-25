import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository, ReportWithPet, ReportWithPetDetail } from "@domain/report/repositories/report.repository";
import { ReportMapper } from "./report.mapper";
import { Prisma, PrismaClient } from "@prisma/client";
import { ReportQuery } from "@application/usecase/report-usecase/report-query";
import { PetMapper } from "../pet/pet.mapper";
import { reportStatusMap } from "@domain/report/types/report.status";
import { ReportType } from '@domain/report/types/report.type';
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo';
import { AnimalTypeMap } from '@domain/shared/animal-type/animal-type-map';
import { GenderTypeMap } from '@domain/shared/gender-type/gender-map';
import { SizeTypeMap } from '@domain/shared/size-type/size-map';
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { CatalogResolver } from "../catalog/catalog-resolver";
import { inject, injectable } from "tsyringe";


const reportInclude = {
    user: {
        select: { user_id: true, public_id: true }
    },
    sighting_report_detail: { include: { color: true, breed: true } },
    lost_report_detail: true,
    reportImages: true,
} satisfies Prisma.ReportInclude



const SPECIES_SYNONYMS: Record<string, string> = {
    perro: "DOG", perra: "DOG", perros: "DOG", can: "DOG", cachorro: "DOG",
    gato: "CAT", gata: "CAT", gatos: "CAT", michi: "CAT",
};
const GENDER_SYNONYMS: Record<string, string> = {
    macho: "MALE", machos: "MALE", hembra: "FEMALE", hembras: "FEMALE",
};
const SIZE_SYNONYMS: Record<string, string> = {
    grande: "LARGE", grandes: "LARGE",
    mediano: "MEDIUM", medio: "MEDIUM", medianos: "MEDIUM",
    chico: "SMALL", chica: "SMALL", chicos: "SMALL",
    pequeno: "SMALL", pequena: "SMALL", peque: "SMALL",
};

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .split(/\s+/)
        .filter(Boolean);
}


function synonymCodes(words: string[], dict: Record<string, string>): string[] {
    return [...new Set(
        words.flatMap((w) =>
            w.length >= 3
                ? Object.entries(dict)
                    .filter(([key]) => key.startsWith(w))
                    .map(([, code]) => code)
                : [],
        ),
    )];
}

@injectable()
export class PrismaReportRepository implements ReportRepository {
    private readonly catalog: CatalogResolver;

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) {
        this.catalog = new CatalogResolver(prisma);
    }
    async findDetailsByIds(ids: number[]): Promise<ReportWithPetDetail[]> {
        const raw = await this.prisma.report.findMany(
            {
                where: { report_id: { in: ids } },
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
            return [];
        }

        return raw.map(r => {
            return {
                report: ReportMapper.toDomain(r),
                pet: r.lost_report_detail?.pet
                    ? PetMapper.toDomain(r.lost_report_detail.pet)
                    : undefined,
            }
        }) as ReportWithPetDetail[];

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


    async save(report: Report, images?: SightingImage[]): Promise<number> {
        let colorId: number | undefined;
        let breedId: number | null | undefined;
        if (report.reportType === ReportType.SIGHTING) {
            const details = report.details as SightingReportDetails;
            colorId = await this.catalog.colorId(details.color);
            breedId = await this.catalog.breedId(details.breed, details.animalType);
        }
        const data = ReportMapper.toPersistence(report, colorId, breedId);

        const created = await this.prisma.$transaction(async (tx) => {
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

            return created.report_id;
        });

        return created;
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
            const matchingIds = await this.findIdsBySearchQuery(filters.q);

            if (matchingIds.length === 0) {
                return [];
            }

            where.public_id = {
                in: matchingIds,
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
            where.occurred_at = {
                ...(filters.createdFrom && { gte: new Date(`${filters.createdFrom}T00:00:00.000-03:00`) }),
                ...(filters.createdTo && { lte: new Date(`${filters.createdTo}T23:59:59.999-03:00`) })
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
            const matchingIds = await this.findIdsBySearchQuery(query.q);
            if (matchingIds.length === 0) {
                return [];
            }

            where.public_id = {
                in: matchingIds
            };
        }

        if (query.status) {
            where.reportStatus = { name: query.status }
        }

        if (query.reportType) {
            where.reportType = { name: query.reportType }
        }

        if (query.createdFrom || query.createdTo) {
            where.occurred_at = {
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

    private async findIdsBySearchQuery(queryText: string): Promise<string[]> {
        const searchText = queryText.trim();
        const pattern = `%${searchText}%`;

        const words = tokenize(searchText);
        const speciesCodes = synonymCodes(words, SPECIES_SYNONYMS);
        const genderCodes = synonymCodes(words, GENDER_SYNONYMS);
        const sizeCodes = synonymCodes(words, SIZE_SYNONYMS);

        const conditions: Prisma.Sql[] = [
            Prisma.sql`unaccent(r."description") ILIKE unaccent(${pattern})`,
            Prisma.sql`word_similarity(unaccent(${searchText}), unaccent(r."description")) >= 0.3`,
            Prisma.sql`unaccent(r."location_address") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(srd."pet_name") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(p."pet_name") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(c_s."name") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(c_p."name") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(b_s."name") ILIKE unaccent(${pattern})`,
            Prisma.sql`unaccent(b_p."name") ILIKE unaccent(${pattern})`,
        ];

        if (speciesCodes.length) {
            conditions.push(Prisma.sql`at_s."name" IN (${Prisma.join(speciesCodes)})`);
            conditions.push(Prisma.sql`at_p."name" IN (${Prisma.join(speciesCodes)})`);
        }
        if (genderCodes.length) {
            conditions.push(Prisma.sql`g_p."name" IN (${Prisma.join(genderCodes)})`);
        }
        if (sizeCodes.length) {
            conditions.push(Prisma.sql`ps_p."name" IN (${Prisma.join(sizeCodes)})`);
        }

        const whereClause = Prisma.join(conditions, " OR ");

        const rows = await this.prisma.$queryRaw<Array<{ public_id: string }>>(
            Prisma.sql`
                SELECT r."public_id"::text AS "public_id"
                FROM "reports" r
                LEFT JOIN "sighting_report_details" srd ON srd."report_id" = r."report_id"
                LEFT JOIN "lost_report_details" lrd ON lrd."report_id" = r."report_id"
                LEFT JOIN "pets" p ON p."pet_id" = lrd."pet_id"
                LEFT JOIN "animal_types" at_s ON at_s."animal_type_id" = srd."animal_type_id"
                LEFT JOIN "animal_types" at_p ON at_p."animal_type_id" = p."animal_type_id"
                LEFT JOIN "colors" c_s ON c_s."color_id" = srd."color_id"
                LEFT JOIN "colors" c_p ON c_p."color_id" = p."color_id"
                LEFT JOIN "breeds" b_s ON b_s."breed_id" = srd."breed_id"
                LEFT JOIN "breeds" b_p ON b_p."breed_id" = p."breed_id"
                LEFT JOIN "genders" g_p ON g_p."gender_id" = p."gender_id"
                LEFT JOIN "pet_sizes" ps_p ON ps_p."size_id" = p."size_id"
                WHERE ${whereClause}
                ORDER BY GREATEST(
                    similarity(unaccent(COALESCE(r."description", '')), unaccent(${searchText})),
                    word_similarity(unaccent(${searchText}), unaccent(COALESCE(r."description", '')))
                ) DESC
            `,
        );

        return rows.map((row) => row.public_id);
    }

}
