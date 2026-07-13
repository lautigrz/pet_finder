import type { PetRepository } from '@domain/pet/repositories/pet.repository';
import type { ReportRepository } from '@domain/report/repositories/report.repository';
import { Pet } from '@domain/pet/aggregates/PetAggregate';
import { PetImage } from '@domain/pet/value-objects/image.vo';
import { Report } from '@domain/report/aggregates/ReportAggregate';
import { ReportDescription } from '@domain/report/value-objects/description.vo';
import { Location } from '@domain/report/value-objects/location.vo';
import { LostReportDetails } from '@domain/report/value-objects/lost-report-details.vo';
import { ReportNotFoundError } from '@domain/errors/ReportNotFoundError';
import { UnauthorizedReportEditError } from '@domain/errors/UnauthorizedReportEditError';
import { ReportClosedError } from '@domain/errors/ReportClosedError';
import { InvalidFieldError } from '@application/errors/errors';
import { ReportType, ReportTypeToNumber } from '@domain/report/types/report.type';
import { ReportStatus } from '@domain/report/types/report.status';
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo';
import { SightingImage } from '@domain/report/value-objects/sighting.images';
import type { StorageService } from '@application/ports/StorageService';
import { UpdateReportDTO } from './dto/update-report.dto';
import { DataChangeType, TypeJob } from '@pet-alert/shared';
import { enqueueMatchingJob } from '@infrastructure/queue/embedding.queue';
import { inject, injectable } from 'tsyringe';

@injectable()
export class UpdateReportUseCase {
  constructor(
    @inject("ReportRepository")
    private readonly reportRepository: ReportRepository,
    @inject("PetRepository")
    private readonly petRepository: PetRepository,
    @inject("StorageService")
    private readonly storageService: StorageService,
  ) { }

  async execute(dto: UpdateReportDTO, userPublicId: string): Promise<void> {
    const report = await this.findReportOrFail(dto.publicId);
    this.validateAuthorization(report, userPublicId);
    this.validateEditable(report);

    const pet = await this.loadLostPetIfNeeded(dto, report);
    const { allImages, imagesChanged } = await this.handleImages(dto, report);
    const changes = this.collectChanges(dto, report, pet, imagesChanged);

    const updatePayload = await this.buildUpdatePayload(dto, report, allImages, pet);

    report.updateFields(updatePayload);
    await this.reportRepository.updateFields(report, allImages);

    await this.enqueueRefreshMatching(report, changes);
  }

  private async findReportOrFail(publicId: string): Promise<Report> {
    const report = await this.reportRepository.findByPublicId(publicId);
    if (!report) {
      throw new ReportNotFoundError(publicId);
    }
    return report;
  }

  private validateAuthorization(report: Report, userPublicId: string): void {
    if (report.userPublicId !== userPublicId) {
      throw new UnauthorizedReportEditError();
    }
  }

  private validateEditable(report: Report): void {
    if (report.status !== ReportStatus.ACTIVE) {
      throw new ReportClosedError(report.publicId);
    }
  }

  private async loadLostPetIfNeeded(dto: UpdateReportDTO, report: Report): Promise<Pet | null> {
    if (report.reportType !== ReportType.LOST || !dto.lostDetails) {
      return null;
    }

    const pet = await this.petRepository.findByPublicId(dto.lostDetails.petPublicId);
    if (!pet || pet.idPet === null) {
      throw new InvalidFieldError('petPublicId', 'Mascota no encontrada');
    }

    if (pet.idPet !== (report.details as LostReportDetails).petId) {
      throw new UnauthorizedReportEditError();
    }
    return pet;
  }

  private collectChanges(
    dto: UpdateReportDTO,
    report: Report,
    pet: Pet | null,
    imagesChanged: boolean
  ): DataChangeType[] {
    const changes: DataChangeType[] = [];

    if (this.detectDescriptionChange(dto, report)) {
      changes.push(DataChangeType.DESCRIPTION);
    }
    if (this.detectLocationChange(dto, report)) {
      changes.push(DataChangeType.LOCATION);
    }
    if (this.detectAttributeChanges(dto, report, pet)) {
      changes.push(DataChangeType.ATTRIBUTES);
    }
    if (imagesChanged) {
      changes.push(DataChangeType.IMAGE);
    }

    return changes;
  }

  private detectDescriptionChange(dto: UpdateReportDTO, report: Report): boolean {
    if (dto.description === undefined) return false;
    const currentDesc = report.description?.value ?? null;
    const newDesc = dto.description ?? null;
    return currentDesc !== newDesc;
  }

  private detectLocationChange(dto: UpdateReportDTO, report: Report): boolean {
    if (!dto.location) return false;
    const currentLoc = report.location;
    return (
      !currentLoc ||
      currentLoc.address !== dto.location.address ||
      currentLoc.latitude !== dto.location.latitude ||
      currentLoc.longitude !== dto.location.longitude
    );
  }

  private async enqueueRefreshMatching(report: Report, changes: DataChangeType[]): Promise<void> {
    if (changes.length === 0 || report.idReport === null) return;

    await enqueueMatchingJob({
      type: TypeJob.REFRESH_MATCHING,
      reportId: report.idReport,
      reportType: ReportTypeToNumber[report.reportType],
      reportTypeName: report.reportType,
      changes,
    });
  }

  private detectAttributeChanges(dto: UpdateReportDTO, report: Report, pet: Pet | null): boolean {
    if (report.reportType === ReportType.SIGHTING && dto.sightingDetails) {
      const cur = report.details as SightingReportDetails;
      const sd = dto.sightingDetails;
      return (
        (sd.petName !== undefined && (sd.petName ?? null) !== (cur.petName ?? null)) ||
        (sd.animalType !== undefined && sd.animalType !== cur.animalType) ||
        (sd.genderType !== undefined && (sd.genderType ?? null) !== (cur.genderType ?? null)) ||
        (sd.sizeType !== undefined && (sd.sizeType ?? null) !== (cur.sizeType ?? null)) ||
        (sd.breed !== undefined && (sd.breed ?? null) !== (cur.breed ?? null)) ||
        (sd.hasIdCollar !== undefined && sd.hasIdCollar !== cur.hasIdCollar) ||
        (sd.color !== undefined && sd.color !== cur.color)
      );
    }

    if (report.reportType === ReportType.LOST && dto.lostDetails && pet) {
      const ld = dto.lostDetails;
      return (
        (ld.name !== undefined && (ld.name ?? '') !== pet.name) ||
        (ld.animalType !== undefined && ld.animalType !== pet.animalType) ||
        (ld.genderType !== undefined && ld.genderType !== pet.genderType) ||
        (ld.sizeType !== undefined && ld.sizeType !== pet.sizeType) ||
        (ld.breed !== undefined && (ld.breed?.trim() ?? '') !== pet.breed) ||
        (ld.color !== undefined && ld.color.trim() !== pet.color) ||
        (ld.hasIdCollar !== undefined && ld.hasIdCollar !== pet.hasIdCollar)
      );
    }

    return false;
  }

  private async handleImages(
    dto: UpdateReportDTO,
    report: Report
  ): Promise<{ allImages: SightingImage[]; imagesChanged: boolean }> {
    const currentImages = await this.getCurrentImages(report);

    const keepIds = new Set(dto.keepImageIds ?? currentImages.map(img => img.cloudinaryId));
    const [keptImages, removedImages] = this.partitionImages(currentImages, keepIds);

    const newImages = await this.uploadNewImages(dto.newImages);
    const imagesChanged = removedImages.length > 0 || newImages.length > 0;

    if (removedImages.length > 0) {
      await Promise.all(removedImages.map(img => this.storageService.delete(img.cloudinaryId)));
    }

    return {
      allImages: [...keptImages, ...newImages],
      imagesChanged,
    };
  }

  private async getCurrentImages(report: Report): Promise<SightingImage[]> {
    if (report.reportType === ReportType.SIGHTING) {
      return (report.details as SightingReportDetails).images ?? [];
    }
    return this.reportRepository.findImagesByReportId(report.publicId);
  }

  private partitionImages(
    images: SightingImage[],
    keepIds: Set<string>
  ): [kept: SightingImage[], removed: SightingImage[]] {
    const kept: SightingImage[] = [];
    const removed: SightingImage[] = [];

    for (const img of images) {
      if (keepIds.has(img.cloudinaryId)) {
        kept.push(img);
      } else {
        removed.push(img);
      }
    }

    return [kept, removed];
  }

  private async uploadNewImages(newImages?: Buffer[]): Promise<SightingImage[]> {
    if (!newImages || newImages.length === 0) return [];

    const uploaded = await Promise.all(
      newImages.map(buf => this.storageService.upload(buf, 'reports'))
    );

    return uploaded.map(r => SightingImage.create({ cloudinaryId: r.publicId, photoUrl: r.url }));
  }

  private async buildUpdatePayload(
    dto: UpdateReportDTO,
    report: Report,
    allImages: SightingImage[],
    pet: Pet | null
  ): Promise<Parameters<typeof report.updateFields>[0]> {
    const payload: Parameters<typeof report.updateFields>[0] = {
      description: this.buildDescription(dto.description),
      occurredAt: dto.occurredAt,
      location: dto.location ? Location.create(dto.location) : undefined,
    };

    if (report.reportType === ReportType.SIGHTING) {
      payload.details = this.buildSightingDetails(report, dto.sightingDetails, allImages);
    } else if (report.reportType === ReportType.LOST && dto.lostDetails && pet) {
      payload.details = await this.updateLostPet(pet, dto.lostDetails, allImages);
    }

    return payload;
  }

  private buildDescription(description?: string | null): ReportDescription | null | undefined {
    if (description === undefined) return undefined;
    return description ? ReportDescription.create(description) : null;
  }

  private buildSightingDetails(
    report: Report,
    sightingDetails: UpdateReportDTO['sightingDetails'],
    images: SightingImage[]
  ): SightingReportDetails {
    const currentDetails = report.details as SightingReportDetails;
    const sd = sightingDetails;

    return SightingReportDetails.create({
      petName: this.getOrKeepValue(sd?.petName, currentDetails.petName),
      animalType: sd?.animalType ?? currentDetails.animalType,
      genderType: this.getOrKeepValue(sd?.genderType, currentDetails.genderType),
      sizeType: this.getOrKeepValue(sd?.sizeType, currentDetails.sizeType),
      breed: this.getOrKeepValue(sd?.breed, currentDetails.breed),
      hasIdCollar: sd?.hasIdCollar ?? currentDetails.hasIdCollar,
      color: sd?.color ?? currentDetails.color,
      isInTransit: currentDetails.isInTransit,
      images,
    });
  }

  private getOrKeepValue<T>(newValue: T | null | undefined, currentValue: T | null | undefined): T | undefined {
    if (newValue === undefined) {
      return currentValue ?? undefined;
    }
    return newValue ?? undefined;
  }

  private async updateLostPet(
    pet: Pet,
    lostDetails: NonNullable<UpdateReportDTO['lostDetails']>,
    allImages: SightingImage[]
  ): Promise<LostReportDetails> {
    if (lostDetails.name != null) pet.rename(lostDetails.name.trim());
    if (lostDetails.animalType) pet.updateAnimalType(lostDetails.animalType);
    if (lostDetails.genderType != null) pet.updateGenderType(lostDetails.genderType);
    if (lostDetails.sizeType != null) pet.updateSizeType(lostDetails.sizeType);
    if (lostDetails.breed !== undefined) pet.updateBreed(lostDetails.breed?.trim() ?? '');
    if (lostDetails.color !== undefined) pet.updateColor(lostDetails.color.trim());
    if (lostDetails.hasIdCollar !== undefined) pet.updateCollarStatus(lostDetails.hasIdCollar);

    const petImages = allImages.map(img =>
      PetImage.create({ cloudinaryId: img.cloudinaryId, photoUrl: img.photoUrl })
    );
    pet.updateImages(petImages);

    await this.petRepository.update(pet);

    return LostReportDetails.create({ petId: pet.idPet! });
  }
}
