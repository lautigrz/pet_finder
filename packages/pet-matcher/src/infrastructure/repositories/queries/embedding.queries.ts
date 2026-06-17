import prisma from '@infrastructure/prisma/prisma.client';
import { groupBy } from '@infrastructure/repositories/utils/vector.utils';
import { RawImageEmb, RawPetImageEmb, RawReportEmb, RawReportImageEmb } from '@infrastructure/repositories/types/raw-embedding.types';

export async function fetchReportDescriptions(reportIds: number[]): Promise<RawReportEmb[]> {
  return prisma.$queryRaw<RawReportEmb[]>`
    SELECT report_id, embedding_description::text
    FROM   reports
    WHERE  report_id = ANY(${reportIds}::int[])
  `;
}


export async function findReportIdsWithinRadius(lat: number, lng: number, radius: number): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ report_id: number }[]>`
    SELECT r.report_id
    FROM   reports r
    WHERE  ST_DWithin(
      geography(ST_MakePoint(r.location_lng, r.location_lat)),
      geography(ST_MakePoint(${lng}, ${lat})),
      ${radius}
    )
    AND    r.report_status_id = 1
  `;
  return rows.map(r => Number(r.report_id));
}

export async function fetchReportImages(reportIds: number[]): Promise<RawReportImageEmb[]> {
  return prisma.$queryRaw<RawReportImageEmb[]>`
    SELECT ri.image_id, ri.report_id, ri.embedding_photo::text
    FROM   report_images ri
    WHERE  ri.report_id = ANY(${reportIds}::int[])
  `;
}

export async function fetchPetImages(petIds: number[]): Promise<RawPetImageEmb[]> {
  return prisma.$queryRaw<RawPetImageEmb[]>`
    SELECT pi.image_id, pi.pet_id, pi.embedding_photo::text
    FROM   pet_images pi
    WHERE  pi.pet_id = ANY(${petIds}::int[])
  `;
}

export function groupImagesByReport(rows: RawReportImageEmb[]): Map<number, RawImageEmb[]> {
  return groupBy(rows, r => r.report_id);
}

export function groupImagesByPet(rows: RawPetImageEmb[]): Map<number, RawImageEmb[]> {
  return groupBy(rows, r => r.pet_id);
}
