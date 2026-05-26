import { Report } from "@domain/report/aggregates/report.aggregate"
import { ReportRepository } from "@domain/report/repositories/report.repository"
import { ReportDetails } from "@domain/report/types/report-details.type"
import { ReportType } from "@domain/report/types/report.type"
import { ReportDescription } from "@domain/report/value-objects/description.vo"
import { Location } from "@domain/report/value-objects/location.vo"
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo"
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo"

export interface CreateReportDTO {
  userId: number
  type: ReportType
  description?: string
  occurredAt: Date
  location: {
    address: string
    latitude: number
    longitude: number
  }
  // lost
  petId?: number
  // sighting
  animalTypeId?: number
  hasIdCollar?: boolean
  color?: string

}


export class CreateReportUseCase{
    constructor(private reportRepository: ReportRepository){}

    async execute(dto: CreateReportDTO): Promise<void> {
    const location = Location.create({
      address: dto.location.address,
      latitude: dto.location.latitude,
      longitude: dto.location.longitude,
    })

    const details = this.buildDetails(dto)

    const report = Report.create({
      userId: dto.userId,
      type: dto.type,
      description: dto.description ? ReportDescription.create(dto.description) : null,
      location,
      details,
      occurredAt: dto.occurredAt,
    })

    await this.reportRepository.save(report)
  }

  private buildDetails(dto: CreateReportDTO): ReportDetails {
    if (dto.type === ReportType.LOST) {
      if (!dto.petId) {
        throw new Error('Lost report requires petId and lostAt')
      }
      return LostReportDetails.create({
        petId: dto.petId,
      })
    }

    if (dto.type === ReportType.SIGHTING) {
      if (!dto.animalTypeId) {
        throw new Error('Sighting report requires animalTypeId, color and seenAt')
      }
      return SightingReportDetails.create({
        animalTypeId: dto.animalTypeId,
        hasIdCollar: dto.hasIdCollar ?? false,
        color: dto.color ?? 'unknown', // TODO: add color to request
      })
    }

    throw new Error(`Unknown report type: ${dto.type}`)
  }
}