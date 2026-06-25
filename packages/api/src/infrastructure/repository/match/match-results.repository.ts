import { MatchResultsEntity } from "@domain/match/entities/MatchResultsEntity";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { Prisma, PrismaClient } from "@prisma/client";
import { MatchResultsMapper } from "./match-results.mapper";
import { MatchNotification, MatchRole } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

const LOST_TYPE_ID = 1;
const SIGHTING_TYPE_ID = 2;

const NOTIFICATION_INCLUDE = {
    user: { select: { public_id: true } },
    lost_report_detail: { include: { pet: { select: { pet_name: true, petImages: { select: { photoUrl: true }, take: 1 } } } } },
    reportImages: { select: { photoUrl: true }, take: 1 },
} satisfies Prisma.ReportInclude;

type NotificationReportRow = Prisma.ReportGetPayload<{ include: typeof NOTIFICATION_INCLUDE }>;

@injectable()
export class PrismaMatchResultsRepository implements MatchResultsRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async findById(id: number): Promise<MatchResultsEntity | null> {
        const result = await this.prisma.matchResult.findUnique({
            where: { match_result_id: id }
        });

        return result ? MatchResultsMapper.toDomain(result) : null;
    }
    async findResultsBySourceReportId(sourceReportId: number): Promise<MatchResultsEntity[]> {

        const results = await this.prisma.matchResult.findMany({
            where: { source_report_id: sourceReportId, score: { gte: 0.70 } },
            orderBy: { score: 'desc' },
            take: 10
        });

        return results.map((result) => MatchResultsMapper.toDomain(result));
    }

    async findNotificationsByUser(userPublicId: string): Promise<MatchNotification[]> {
        const rows = await this.prisma.matchResult.findMany({
            where: {
                OR: [
                    {
                        source_report: { report_type_id: LOST_TYPE_ID, user: { public_id: userPublicId } },
                        candidate_report: { report_type_id: SIGHTING_TYPE_ID },
                    },
                    {
                        candidate_report: { report_type_id: LOST_TYPE_ID, user: { public_id: userPublicId } },
                        source_report: { report_type_id: SIGHTING_TYPE_ID },
                    },
                    {
                        source_report: { report_type_id: SIGHTING_TYPE_ID, user: { public_id: userPublicId } },
                        candidate_report: { report_type_id: LOST_TYPE_ID },
                    },
                    {
                        candidate_report: { report_type_id: SIGHTING_TYPE_ID, user: { public_id: userPublicId } },
                        source_report: { report_type_id: LOST_TYPE_ID },
                    },
                ],
            },
            include: {
                source_report: { include: NOTIFICATION_INCLUDE },
                candidate_report: { include: NOTIFICATION_INCLUDE },
            },
            orderBy: { created_at: "desc" },
            take: 50,
        });

        return rows.flatMap((row) => {
            const sourceIsLost = row.source_report.report_type_id === LOST_TYPE_ID;
            const lost = sourceIsLost ? row.source_report : row.candidate_report;
            const sighting = sourceIsLost ? row.candidate_report : row.source_report;
            if (lost.user.public_id === sighting.user.public_id) return [];
            const rol: MatchRole = lost.user.public_id === userPublicId ? "dueno" : "avistador";
            return [toMatchNotification(row.public_id, row.score, row.created_at, lost, sighting, rol, userPublicId)];
        });
    }
}

function toMatchNotification(
    matchPublicId: string,
    score: number,
    createdAt: Date,
    lost: NotificationReportRow,
    sighting: NotificationReportRow,
    rol: MatchRole,
    ownerPublicId: string,
): MatchNotification {
    return {
        ownerPublicId,
        rol,
        lostReportPublicId: lost.public_id,
        lostPetName: lost.lost_report_detail?.pet?.pet_name ?? null,
        lostPetImage: lost.lost_report_detail?.pet?.petImages?.[0]?.photoUrl ?? null,
        matchPublicId,
        matchedReportPublicId: sighting.public_id,
        matchedImage: sighting.reportImages[0]?.photoUrl ?? null,
        score,
        createdAt: createdAt.toISOString(),
    };
}