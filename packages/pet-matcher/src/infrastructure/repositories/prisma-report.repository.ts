import prisma from '@infrastructure/prisma/prisma.client';
import { IReportRepository } from '../../domain/repositories/report.repository';
import { DetailsReport, LocationReport, ReportEntity } from '../../domain/entities/report.entity';
import { MatchResult } from '../../domain/entities/match-result.entity';
import { Prisma } from '@prisma/client';
import {
  fetchReportDescriptions,
  fetchReportImages,
  fetchPetImages,
  groupImagesByReport,
  groupImagesByPet,
  findReportIdsWithinRadius,
} from './queries/embedding.queries';
import { toReportEntity, REPORT_INCLUDE } from './mappers/report.mapper';
import { RawPetImageEmb } from './types/raw-embedding.types';
import { toVectorLiteral } from './utils/vector.utils';
import { ReportType } from './types/report-type';
import { logger, MatchNotification } from '@pet-alert/shared';

function withDbTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[DB timeout] ${context} exceeded ${ms}ms`)), ms),
    ),
  ]);
}

const DB_TIMEOUT_MS = 10_000;
const SEARCH_RADIUS_METERS = 5000;
const ACTIVE_REPORT_STATUS_ID = 1;

export class PrismaReportRepository implements IReportRepository {

  async findById(id: number): Promise<ReportEntity | null> {

    const row = await prisma.report.findUnique({
      where: { report_id: id },
      include: REPORT_INCLUDE,
    });

    if (!row) return null;

    const petId = row.lost_report_detail?.pet?.pet_id ?? null;

    const [descEmbs, imgEmbs, petImgEmbs] = await Promise.all([
      fetchReportDescriptions([row.report_id]),
      fetchReportImages([row.report_id]),
      petId ? fetchPetImages([petId]) : Promise.resolve([] as RawPetImageEmb[]),
    ]);

    return toReportEntity(
      row,
      descEmbs[0] ?? null,
      groupImagesByReport(imgEmbs).get(row.report_id) ?? [],
      petId ? (groupImagesByPet(petImgEmbs).get(petId) ?? []) : [],
    );
  }

  async findCandidatesReportsActives(reportId: number, reportTypeId: number, details: DetailsReport, location: LocationReport): Promise<ReportEntity[]> {

    const nearbyIds = await findReportIdsWithinRadius(
      location.locationLat,
      location.locationLng,
      SEARCH_RADIUS_METERS
    );

    if (nearbyIds.length === 0) return [];

    const candidateFilter = reportTypeId === ReportType.LOST
      ? buildSightingFilter(details)
      : buildLostFilter(details);

    const rows = await prisma.report.findMany({
      where: {
        ...candidateFilter,
        report_id: {
          not: reportId,
          in: nearbyIds,
        },
      },
      include: REPORT_INCLUDE,
    });

    const reportIds = rows.map(r => r.report_id);

    const petIds = [...new Set(
      rows
        .map(r => r.lost_report_detail?.pet?.pet_id)
        .filter((id): id is number => id != null)
    )];

    const [descEmbs, imgEmbs, petImgEmbs] = await Promise.all([
      fetchReportDescriptions(reportIds),
      fetchReportImages(reportIds),
      petIds.length > 0
        ? fetchPetImages(petIds)
        : Promise.resolve([] as RawPetImageEmb[]),
    ]);

    const descEmbByReport = new Map(descEmbs.map(e => [e.report_id, e]));
    const imgEmbByReport = groupImagesByReport(imgEmbs);
    const imgEmbByPet = groupImagesByPet(petImgEmbs);

    return rows.map(row => {
      const petId = row.lost_report_detail?.pet?.pet_id ?? null;
      return toReportEntity(
        row,
        descEmbByReport.get(row.report_id) ?? null,
        imgEmbByReport.get(row.report_id) ?? [],
        petId != null ? (imgEmbByPet.get(petId) ?? []) : [],
      );
    });
  }

  async updateDescriptionEmbedding(reportId: number, embedding: number[]): Promise<void> {
    const vector = toVectorLiteral(embedding);
    await withDbTimeout(
      prisma.$executeRaw`
        UPDATE reports
        SET    embedding_description = ${vector}::vector
        WHERE  report_id = ${reportId}
      `,
      DB_TIMEOUT_MS,
      `updateDescriptionEmbedding(reportId=${reportId})`,
    );
  }

  async updateImageEmbedding(imageId: number, embedding: number[]): Promise<void> {
    const vector = toVectorLiteral(embedding);
    await withDbTimeout(
      prisma.$executeRaw`
        UPDATE report_images
        SET    embedding_photo = ${vector}::vector
        WHERE  image_id = ${imageId}
      `,
      DB_TIMEOUT_MS,
      `updateImageEmbedding(imageId=${imageId})`,
    );
  }

  async saveMatchResults(sourceReportId: number, results: MatchResult[]): Promise<void> {
    if (results.length === 0) return;

    const resultsUpsert = await Promise.allSettled(
      results.map(r => buildMatchResultUpsert(prisma, sourceReportId, r)),
    );

    const failed = resultsUpsert.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      logger.error(`[PrismaReportRepository] Failed to save ${failed.length} match results for report ${sourceReportId}`);
    }
  }

  async findMatchNotifications(sourceReportId: number, candidateReportIds: number[]): Promise<MatchNotification[]> {
    if (candidateReportIds.length === 0) return [];

    const pairs = candidateReportIds.map(candId => ({
      source_report_id: Math.min(sourceReportId, candId),
      candidate_report_id: Math.max(sourceReportId, candId),
    }));

    const rows = await prisma.matchResult.findMany({
      where: {
        OR: pairs,
      },
      include: {
        source_report: { include: MATCH_NOTIFICATION_INCLUDE },
        candidate_report: { include: MATCH_NOTIFICATION_INCLUDE },
      },
    });

    return rows.flatMap(row => {
      const pair = toLostSightingPair(row.source_report, row.candidate_report);
      if (!pair) return [];

      const { lost, sighting } = pair;
      if (lost.report_status_id !== ACTIVE_REPORT_STATUS_ID || sighting.report_status_id !== ACTIVE_REPORT_STATUS_ID) return [];
      if (lost.user.public_id === sighting.user.public_id) return [];

      const base = {
        lostReportPublicId: lost.public_id,
        lostPetName: lost.lost_report_detail?.pet?.pet_name ?? null,
        lostPetImage: lost.lost_report_detail?.pet?.petImages?.[0]?.photoUrl ?? null,
        matchPublicId: row.public_id,
        matchedReportPublicId: sighting.public_id,
        matchedImage: sighting.reportImages[0]?.photoUrl ?? null,
        score: row.score,
        createdAt: row.created_at.toISOString(),
      };

      return [
        { ...base, ownerPublicId: lost.user.public_id, rol: 'dueno' as const },
        { ...base, ownerPublicId: sighting.user.public_id, rol: 'avistador' as const },
      ];
    });
  }
}


function buildSightingFilter(details: DetailsReport): Prisma.ReportWhereInput {
  return {
    report_type_id: 2,
    report_status_id: 1,
    ...(details.animalType && {
      sighting_report_detail: { animal_type: { name: details.animalType } },
    }),
  };
}

function buildLostFilter(details: DetailsReport): Prisma.ReportWhereInput {
  return {
    report_type_id: 1,
    report_status_id: 1,
    ...(details.animalType && {
      lost_report_detail: { pet: { animal_type: { name: details.animalType } } },
    }),
  };
}

function buildMatchResultUpsert(
  tx: typeof prisma,
  sourceReportId: number,
  result: MatchResult,
) {
  const sourceId = Math.min(sourceReportId, result.reportId);
  const candidateId = Math.max(sourceReportId, result.reportId);

  return tx.matchResult.upsert({
    where: {
      source_report_id_candidate_report_id: {
        source_report_id: sourceId,
        candidate_report_id: candidateId,
      },
    },
    update: {
      score: result.score,
      image_score: result.imageScore,
      description_score: result.descriptionScore,
      shared_fields: result.sharedFields,
      structured_score: result.structuredScore,
    },
    create: {
      source_report_id: sourceId,
      candidate_report_id: candidateId,
      score: result.score,
      image_score: result.imageScore,
      description_score: result.descriptionScore,
      shared_fields: result.sharedFields,
      structured_score: result.structuredScore,
    },
  });
}

const MATCH_NOTIFICATION_INCLUDE = {
  user: { select: { public_id: true } },
  lost_report_detail: { include: { pet: { select: { pet_name: true, petImages: { select: { photoUrl: true }, take: 1 } } } } },
  reportImages: { select: { photoUrl: true }, take: 1 },
} satisfies Prisma.ReportInclude;

type NotificationReportRow = Prisma.ReportGetPayload<{ include: typeof MATCH_NOTIFICATION_INCLUDE }>;

function toLostSightingPair(
  a: NotificationReportRow,
  b: NotificationReportRow,
): { lost: NotificationReportRow; sighting: NotificationReportRow } | null {
  const aIsLost = a.report_type_id === ReportType.LOST;
  const bIsLost = b.report_type_id === ReportType.LOST;
  if (aIsLost === bIsLost) return null;
  return aIsLost ? { lost: a, sighting: b } : { lost: b, sighting: a };
}
