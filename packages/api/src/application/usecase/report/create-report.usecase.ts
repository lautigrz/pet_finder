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
import { StorageService } from "@application/ports/StorageService"
import { SightingImage } from "@domain/report/value-objects/sighting.images"

interface LocationDTO {

  address: string
  latitude: number
  longitude: number

}

export type CreateReportDTO =
  | { type: typeof ReportType.LOST; petId: string; occurredAt: Date; location: LocationDTO; description: string }
  | { type: typeof ReportType.SIGHTING; animalType: AnimalType; hasIdCollar: boolean; color: string; occurredAt: Date; location: LocationDTO; description: string, images: Buffer[] }


export class CreateReportUseCase {
  constructor(private reportRepository: ReportRepository,
    private userRepository: IUserRepository,
    private petRepository: PetRepository,
    private storageService: StorageService,) { }

  async execute(dto: CreateReportDTO, userId: string): Promise<void> {
    console.log('1. buscando user');
    const user = await this.userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error("User not found");
    }
    console.log('2. user encontrado');
    let id: number | null = null

    if (dto.type === ReportType.LOST && dto.petId) {
      console.log('3. buscando pet');
      const pet: Pet | null = await this.petRepository.findByPublicId(dto.petId);
      console.log('4. pet encontrado');

      if (!pet) {
        throw new Error("Pet not found");
      }
      id = pet.idPet

    }



    this.validateDTO(dto);
    console.log('5. dto validado');
    const location = this.buildLocation(dto.location);
    console.log('6. location construido');
    const details = await this.buildDetails(dto, id!)
    console.log('7. details construido');
    const report = this.buildReport(dto, location, details, user);
    console.log('8. report construido');

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

  private async buildDetails(dto: CreateReportDTO, petId?: number): Promise<ReportDetails> {
    if (dto.type === ReportType.LOST) {
      if (!petId) {
        throw new Error("Pet id is required for lost report");
      }
      return LostReportDetails.create({ petId })
    }

    if (dto.type === ReportType.SIGHTING) {
      const images = await this.buildImages(dto.images)
      return SightingReportDetails.create({
        animalType: dto.animalType,
        hasIdCollar: dto.hasIdCollar,
        color: dto.color,
        images
      })
    }

    throw new InvalidReportTypeError("Type must be either 'LOST' or 'SIGHTING'");

  }


  private async buildImages(images: Buffer[]): Promise<SightingImage[]> {
    const results = await Promise.all(
      images.map(img => this.storageService.upload(img, 'reports'))
    );

    return results.map(res => SightingImage.create({
      cloudinaryId: res.publicId,
      photoUrl: res.url,
    }));
  }


  private validateDTO(dto: CreateReportDTO): void {

    if (dto.occurredAt > new Date()) {
      throw new InvalidFieldError('occurredAt', 'cannot be in the future')
    }
  }
}