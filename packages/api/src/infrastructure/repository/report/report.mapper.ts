import { Report } from '@domain/report/aggregates/report.aggregate'
import { ReportStatus } from '@domain/report/types/report.status'
import { ReportType } from '@domain/report/types/report.type'
import { LostReportDetails } from '@domain/report/value-objects/lost-report-details.vo'
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo'
import { Prisma } from '@prisma/client'

  const reportTypeMap: Record<ReportType, number> = {
  [ReportType.LOST]: 1,
  [ReportType.SIGHTING]: 2,
}

const reportStatusMap: Record<ReportStatus, number> = {
  [ReportStatus.ACTIVE]: 1,
  [ReportStatus.RESOLVED]: 2,
  [ReportStatus.CLOSED]: 3,
}


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
    user:{ connect: { user_id: report.userId } }, // TODO: connect to actual user
      description: report.description?.value,
      occurred_at: report.occurredAt,
      location_address: report.location.address,
      location_lat: report.location.latitude,
      location_lng: report.location.longitude,
      created_at: report.createdAt,
      ...ReportMapper.buildDetailsInput(report),
    }
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
          animal_type: { connect: { animal_type_id: d.animalTypeId } },
          has_id_collar: d.hasIdCollar,
          color: d.color,
        }
      }
    }
  }

  throw new Error(`Unknown report type: ${report.reportType}`)
}


}
