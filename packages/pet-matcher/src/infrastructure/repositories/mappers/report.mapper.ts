import { DetailsReport, LocationReport, ReportEntity, ReportImageEntity } from '@domain/entities/report.entity';
import { RawImageEmb, RawReportEmb } from '@infrastructure/repositories/types/raw-embedding.types';
import { parseVector } from '@infrastructure/repositories/utils/vector.utils';
import { Prisma } from '@prisma/client';
import { ReportType } from '@infrastructure/repositories/types/report-type';


type SightingDetail = Prisma.SightingReportDetailGetPayload<{
  include: typeof REPORT_INCLUDE.sighting_report_detail.include;
}> | null;

type LostPet = Prisma.PetGetPayload<{
  include: typeof REPORT_INCLUDE.lost_report_detail.include.pet.include;
}> | null;


export const REPORT_INCLUDE = {
  sighting_report_detail: {
    include: {
      animal_type: { select: { name: true } },
      gender: { select: { name: true } },
      size: { select: { name: true } },
      color: { select: { name: true } },
      breed: { select: { name: true } },
    },
  },
  lost_report_detail: {
    include: {
      pet: {
        include: {
          animal_type: { select: { name: true } },
          gender: { select: { name: true } },
          size: { select: { name: true } },
          breed: { select: { name: true } },
          color: { select: { name: true } },
          petImages: { select: { imageId: true, photoUrl: true } },
        },
      },
    },
  },
  reportImages: { select: { imageId: true, photoUrl: true } },
} satisfies Prisma.ReportInclude;
type ReportRow = Prisma.ReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

export function toReportEntity(
  row: ReportRow,
  descEmb: RawReportEmb | null,
  imageEmbs: RawImageEmb[],
  petImageEmbs: RawImageEmb[],
): ReportEntity {
  const sighting = row.sighting_report_detail ?? null;
  const lostPet = row.lost_report_detail?.pet ?? null;

  const imageEmbById = new Map(imageEmbs.map(e => [e.image_id, e.embedding_photo]));
  const petImageEmbById = new Map(petImageEmbs.map(e => [e.image_id, e.embedding_photo]));

  const reportImages = mapImages(row.reportImages ?? [], imageEmbById);
  const petImages = mapImages(lostPet?.petImages ?? [], petImageEmbById);

  const isLost = row.report_type_id === ReportType.LOST;
  const images = isLost ? petImages : reportImages;

  return {
    reportId: row.report_id,
    publicId: row.public_id,
    reportTypeId: row.report_type_id,
    reportStatusId: row.report_status_id,
    details: buildDetails(sighting, lostPet),
    description: row.description ?? null,
    location: buildLocation(row),
    embeddingDescription: parseVector(descEmb?.embedding_description ?? null),
    images,
  };
}

function buildLocation(row: ReportRow): LocationReport {
  return {
    locationLat: Number(row.location_lat),
    locationLng: Number(row.location_lng),
  };
}

function buildDetails(sighting: SightingDetail, lostPet: LostPet): DetailsReport {
  return {
    animalType: sighting?.animal_type?.name ?? lostPet?.animal_type?.name,
    breed: sighting?.breed?.name ?? lostPet?.breed?.name,
    color: sighting?.color?.name ?? lostPet?.color?.name,
    gender: sighting?.gender?.name ?? lostPet?.gender?.name,
    size: sighting?.size?.name ?? lostPet?.size?.name,
    hasIdIdentification: sighting?.has_id_collar ?? lostPet?.has_id_collar ?? false,
  };
}

function mapImages(
  rows: { imageId: number; photoUrl: string }[],
  embById: Map<number, string | null>,
): ReportImageEntity[] {
  return rows.map(img => ({
    imageId: img.imageId,
    photoUrl: img.photoUrl,
    embeddingPhoto: parseVector(embById.get(img.imageId) ?? null),
  }));
}
