import type { PetRepository } from '@domain/pet/repositories/pet.repository';
import type { ReportRepository } from '@domain/report/repositories/report.repository';
import { ReportDescription } from '@domain/report/value-objects/description.vo';
import { Location } from '@domain/report/value-objects/location.vo';
import { LostReportDetails } from '@domain/report/value-objects/lost-report-details.vo';
import { ReportNotFoundError } from '@domain/errors/ReportNotFoundError';
import { UnauthorizedReportEditError } from '@domain/errors/UnauthorizedReportEditError';
import { InvalidFieldError } from '@application/errors/errors';
import { ReportType } from '@domain/report/types/report.type';
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo';
import { SightingImage } from '@domain/report/value-objects/sighting.images';
import type { StorageService } from '@application/ports/StorageService';
import { UpdateReportDTO } from './dto/update-report.dto';
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
    const report = await this.reportRepository.findByPublicId(dto.publicId);
    if (!report) throw new ReportNotFoundError(dto.publicId);
    if (report.userPublicId !== userPublicId) throw new UnauthorizedReportEditError();
    if (dto.occurredAt && dto.occurredAt > new Date()) {
      throw new InvalidFieldError('occurredAt', 'cannot be in the future');
    }

    let currentImages: SightingImage[];
    if (report.reportType === ReportType.SIGHTING) {
      currentImages = (report.details as SightingReportDetails).images ?? [];
    } else {
      currentImages = await this.reportRepository.findImagesByReportId(dto.publicId);
    }

    const keepIds = new Set(dto.keepImageIds ?? currentImages.map(i => i.cloudinaryId));
    const keptImages = currentImages.filter(img => keepIds.has(img.cloudinaryId));
    const removed = currentImages.filter(img => !keepIds.has(img.cloudinaryId));

    await Promise.all(removed.map(img => this.storageService.delete(img.cloudinaryId)));

    const uploaded = await Promise.all(
      (dto.newImages ?? []).map(buf => this.storageService.upload(buf, 'reports'))
    );
    const newImages = uploaded.map(r => SightingImage.create({ cloudinaryId: r.publicId, photoUrl: r.url }));
    const allImages = [...keptImages, ...newImages];

    const updatePayload: Parameters<typeof report.updateFields>[0] = {
      description: dto.description !== undefined
        ? (dto.description ? ReportDescription.create(dto.description) : null)
        : undefined,
      occurredAt: dto.occurredAt,
      location: dto.location ? Location.create(dto.location) : undefined,
    };

    if (report.reportType === ReportType.SIGHTING) {
      const cur = report.details as SightingReportDetails;
      const sd = dto.sightingDetails;
      updatePayload.details = SightingReportDetails.create({
        petName: sd?.petName !== undefined ? sd.petName ?? undefined : cur.petName ?? undefined,
        animalType: sd?.animalType ?? cur.animalType,
        genderType: sd?.genderType !== undefined ? sd.genderType ?? undefined : cur.genderType ?? undefined,
        sizeType: sd?.sizeType !== undefined ? sd.sizeType ?? undefined : cur.sizeType ?? undefined,
        breed: sd?.breed !== undefined ? sd.breed ?? undefined : cur.breed ?? undefined,
        hasIdCollar: sd?.hasIdCollar ?? cur.hasIdCollar,
        color: sd?.color ?? cur.color,
        isInTransit: sd?.isInTransit ?? cur.isInTransit,
        images: allImages,
      });
    }

    if (report.reportType === ReportType.LOST && dto.lostDetails) {
      const pet = await this.petRepository.findByPublicId(dto.lostDetails.petPublicId);
      if (!pet || pet.idPet === null) throw new InvalidFieldError('petPublicId', 'Mascota no encontrada');

      if (dto.lostDetails.name != null) pet.rename(dto.lostDetails.name.trim());
      if (dto.lostDetails.animalType) pet.updateAnimalType(dto.lostDetails.animalType);
      if (dto.lostDetails.genderType != null) pet.updateGenderType(dto.lostDetails.genderType);
      if (dto.lostDetails.sizeType != null) pet.updateSizeType(dto.lostDetails.sizeType);
      if (dto.lostDetails.breed !== undefined) pet.updateBreed(dto.lostDetails.breed?.trim() ?? '');
      if (dto.lostDetails.color !== undefined) pet.updateColor(dto.lostDetails.color.trim());
      if (dto.lostDetails.hasIdCollar !== undefined) pet.updateCollarStatus(dto.lostDetails.hasIdCollar);

      await this.petRepository.update(pet);
      updatePayload.details = LostReportDetails.create({ petId: pet.idPet });
    }

    report.updateFields(updatePayload);
    await this.reportRepository.updateFields(report, allImages);
  }
}
