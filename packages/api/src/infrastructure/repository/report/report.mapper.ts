import { Report } from '@domain/report/aggregates/report.aggregate'
import { ReportStatus } from '@domain/report/types/report.status'
import { ReportType } from '@domain/report/types/report.type'
import { Location } from '@domain/report/value-objects/location.vo'
import { LostReportDetails } from '@domain/report/value-objects/lost-report-details.vo'
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo'
import { AnimalReverseTypeMap, AnimalTypeMap } from '@domain/shared/animal-type/animal-type-map'
import { Prisma } from '@prisma/client'
import { ReportDescription } from '@domain/report/value-objects/description.vo'
import { ReportDetails } from '@domain/report/types/report-details.type'
import { PersistenceMappingError } from '@infrastructure/errors/PersistenceMappingError'


const reportTypeMap: Record<ReportType, number> = {
  [ReportType.LOST]: 1,
  [ReportType.SIGHTING]: 2,
}

const reportTypeMapReverse: Record<number, ReportType> = {
  [1]: ReportType.LOST,
  [2]: ReportType.SIGHTING,
}


const reportStatusMap: Record<ReportStatus, number> = {
  [ReportStatus.ACTIVE]: 1,
  [ReportStatus.RESOLVED]: 2,
  [ReportStatus.CLOSED]: 3,
}

const reportStatusMapReverse: Record<number, ReportStatus> = {
  [1]: ReportStatus.ACTIVE,
  [2]: ReportStatus.RESOLVED,
  [3]: ReportStatus.CLOSED,
}

type PrismaReport = Prisma.ReportGetPayload<{
  include: {
    user: {
      select: { user_id: true, public_id: true }
    },
    lost_report_detail: true,
    sighting_report_detail: true,
  }
}>


export class ReportMapper {

  static toPersistence(report: Report): Prisma.ReportCreateInput {
    return {
      public_id: report.publicId,
      reportType: {
        connect: { report_type_id: reportTypeMap[report.reportType] },
      },
      reportStatus: {
        connect: { report_status_id: reportStatusMap[report.status] },
      },
      user: { connect: { user_id: report.userId } },
      description: report.description?.value,
      occurred_at: report.occurredAt,
      location_address: report.location.address,
      location_lat: report.location.latitude,
      location_lng: report.location.longitude,
      created_at: report.createdAt,
      ...ReportMapper.buildDetailsInput(report),
    }
  }


  static toDomain(raw: PrismaReport): Report {

    return Report.restore({
      idReport: raw.report_id,
      publicId: raw.public_id,
      userId: raw.user.user_id,
      userPublicId: raw.user.public_id,
      type: reportTypeMapReverse[raw.report_type_id]!,
      currentStatus: reportStatusMapReverse[raw.report_status_id]!,
      description: raw.description ? ReportDescription.create(raw.description) : null,
      location: Location.create({ address: raw.location_address, latitude: raw.location_lat.toNumber(), longitude: raw.location_lng.toNumber() }),
      details: ReportMapper.buildDetails(raw),
      occurredAt: raw.occurred_at,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,

    })

  }

  private static buildDetails(raw: PrismaReport): ReportDetails {
    const reportType = reportTypeMapReverse[raw.report_type_id]!;

    if (reportType === ReportType.LOST) {

      if (!raw.lost_report_detail) throw new PersistenceMappingError("Missing lost report details")
      const details = raw.lost_report_detail as { pet_id: number };
      return new LostReportDetails(details.pet_id)

    }

    if (reportType === ReportType.SIGHTING) {
      if (!raw.sighting_report_detail) throw new PersistenceMappingError("Missing sighting report details")
      const details = raw.sighting_report_detail as { animal_type_id: number, has_id_collar: boolean, color: string };
      return new SightingReportDetails(
        AnimalReverseTypeMap[details.animal_type_id]!,
        details.has_id_collar,
        details.color
      );
    }

    throw new PersistenceMappingError(`Unknown report type: ${reportType}`);
  }


  private static buildDetailsInput(report: Report) {
    if (report.reportType === ReportType.LOST) {
      const d = report.details as LostReportDetails
      return {
        lost_report_detail: {
          create: {
            pet: { connect: { pet_id: d.petId } },
          }
        }
      }
    }

    if (report.reportType === ReportType.SIGHTING) {
      const d = report.details as SightingReportDetails
      return {
        sighting_report_detail: {
          create: {
            animal_type: { connect: { animal_type_id: AnimalTypeMap[d.animalType] } },
            has_id_collar: d.hasIdCollar,
            color: d.color,
          }
        }
      }
    }

    throw new PersistenceMappingError(`Unknown report type: ${report.reportType}`)
  }


}
