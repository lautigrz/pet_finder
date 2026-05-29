import { InvalidFieldError, InvalidReportTypeError } from "@application/errors/errors"
import { User } from "@domain/entities/User"
import { Pet } from "@domain/pet/aggregates/PetAggregate"
import { Report } from "@domain/report/aggregates/ReportAggregate"
import { ReportRepository } from "@domain/report/repositories/report.repository"
import { ReportDetails } from "@domain/report/types/report-details.type"
import { ReportType } from "@domain/report/types/report.type"
import { ReportDescription } from "@domain/report/value-objects/description.vo"
import { Location } from "@domain/report/value-objects/location.vo"
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo"
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo"
import { AnimalType } from "@domain/shared/animal-type/animal-type"
import { PetRepository } from "@domain/pet/repositories/pet.repository"
import { IUserRepository } from "@domain/repositories/IUserRepository"

interface LocationDTO {

  address: string
  latitude: number
  longitude: number

}

export type CreateReportDTO =
  | { type: typeof ReportType.LOST; petId: string; occurredAt: Date; location: LocationDTO; description: string }
  | { type: typeof ReportType.SIGHTING; animalType: AnimalType; hasIdCollar: boolean; color: string; occurredAt: Date; location: LocationDTO; description: string }


export class CreateReportUseCase {
  constructor(private reportRepository: ReportRepository,
    private userRepository: IUserRepository,
    private petRepository: PetRepository) { }

  async execute(dto: CreateReportDTO, userId: string): Promise<void> {

    const user = await this.userRepository.findByPublicId(userId);
    let id: number | null = null

    if (dto.type === ReportType.LOST && dto.petId) {
      const pet: Pet | null = await this.petRepository.findByPublicId(dto.petId);

      if (!pet) {
        throw new Error("Pet not found");
      }
      id = pet.idPet

    }
    if (!user) {
      throw new Error("User not found");
    }

    this.validateDTO(dto);

    const location = this.buildLocation(dto.location);

    const details = this.buildDetails(dto, id!)

    const report = this.buildReport(dto, location, details, user);

    await this.reportRepository.save(report)
  }

  private buildLocation(locationDTO: LocationDTO): Location {
    return Location.create({
      address: locationDTO.address,
      latitude: locationDTO.latitude,
      longitude: locationDTO.longitude,
    })
  }

  private buildReport(dto: CreateReportDTO, location: Location, details: ReportDetails,
    user: User): Report {

    return Report.create({
      userPublicId: user.id,
      userId: user.internalId!,
      type: dto.type,
      description: dto.description ? ReportDescription.create(dto.description) : null,
      location,
      details,
      occurredAt: dto.occurredAt,
    })

  }

  private buildDetails(dto: CreateReportDTO, petId?: number): ReportDetails {
    if (dto.type === ReportType.LOST) {
      if (!petId) {
        throw new Error("Pet id is required for lost report");
      }
      return LostReportDetails.create({ petId })
    }

    if (dto.type === ReportType.SIGHTING) {
      return SightingReportDetails.create({
        animalType: dto.animalType,
        hasIdCollar: dto.hasIdCollar,
        color: dto.color,
      })
    }

    throw new InvalidReportTypeError("Type must be either 'LOST' or 'SIGHTING'");

  }

  private validateDTO(dto: CreateReportDTO): void {

    if (dto.occurredAt > new Date()) {
      throw new InvalidFieldError('occurredAt', 'cannot be in the future')
    }
  }
}