import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateReportUseCase } from '@application/usecase/report-usecase/update-report.usecase';
import { ReportRepository } from '@domain/report/repositories/report.repository';
import { PetRepository } from '@domain/pet/repositories/pet.repository';
import { StorageService } from '@application/ports/StorageService';
import { ReportNotFoundError } from '@domain/errors/ReportNotFoundError';
import { UnauthorizedReportEditError } from '@domain/errors/UnauthorizedReportEditError';
import { ReportClosedError } from '@domain/errors/ReportClosedError';
import { InvalidFieldError } from '@application/errors/errors';
import { ReportType } from '@domain/report/types/report.type';
import { SightingReportDetails } from '@domain/report/value-objects/sighting-report-details.vo';
import { SightingImage } from '@domain/report/value-objects/sighting.images';
import { AnimalType } from '@domain/shared/animal-type/animal-type';
import { UpdateReportDTO } from '@application/usecase/report-usecase/dto/update-report.dto';
import { enqueueMatchingJob } from '@infrastructure/queue/embedding.queue';
import { DataChangeType, TypeJob } from '@pet-alert/shared';

vi.mock('@infrastructure/queue/embedding.queue', () => ({
  enqueueMatchingJob: vi.fn().mockResolvedValue(undefined),
}));


const OWNER_ID = 'user-owner-uuid';
const OTHER_ID = 'user-other-uuid';
const REPORT_ID = 'report-uuid-1';
const PET_PUB_ID = 'pet-uuid-1';

const fakeImage = SightingImage.create({ cloudinaryId: 'reports/img1', photoUrl: 'https://img1.jpg' });

function makeSightingReport() {
  const details = SightingReportDetails.create({
    animalType: AnimalType.DOG,
    color: 'negro',
    hasIdCollar: false,
    isInTransit: false,
    images: [fakeImage],
  });
  return {
    idReport: 1,
    publicId: REPORT_ID,
    userPublicId: OWNER_ID,
    status: 'ACTIVE',
    reportType: ReportType.SIGHTING,
    details,
    updateFields: vi.fn((params) => {
      if (params?.occurredAt && params.occurredAt > new Date()) {
        throw new InvalidFieldError('occurredAt', 'cannot be in the future');
      }
    }),
  };
}

function makeLostReport() {
  return {
    idReport: 2,
    publicId: REPORT_ID,
    userPublicId: OWNER_ID,
    status: 'ACTIVE',
    reportType: ReportType.LOST,
    details: { petId: 10 },
    updateFields: vi.fn((params) => {
      if (params?.occurredAt && params.occurredAt > new Date()) {
        throw new InvalidFieldError('occurredAt', 'cannot be in the future');
      }
    }),
  };
}

function makePet() {
  return {
    idPet: 10,
    publicId: PET_PUB_ID,
    rename: vi.fn(),
    updateAnimalType: vi.fn(),
    updateGenderType: vi.fn(),
    updateSizeType: vi.fn(),
    updateBreed: vi.fn(),
    updateColor: vi.fn(),
    updateCollarStatus: vi.fn(),
    updateImages: vi.fn(),
  };
}

function baseDTO(overrides: Partial<UpdateReportDTO> = {}): UpdateReportDTO {
  return { publicId: REPORT_ID, ...overrides };
}


describe('UpdateReportUseCase', () => {
  let reportRepository: ReportRepository;
  let petRepository: PetRepository;
  let storageService: StorageService;
  let useCase: UpdateReportUseCase;

  beforeEach(() => {
    reportRepository = {
      findByPublicId: vi.fn(),
      findImagesByReportId: vi.fn().mockResolvedValue([fakeImage]),
      updateFields: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReportRepository;

    petRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as PetRepository;

    storageService = {
      upload: vi.fn().mockResolvedValue({ publicId: 'reports/new', url: 'https://new.jpg' }),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageService;

    useCase = new UpdateReportUseCase(reportRepository, petRepository, storageService);
    vi.mocked(enqueueMatchingJob).mockClear();
  });


  describe('autorización', () => {
    it('lanza ReportNotFoundError si el reporte no existe', async () => {
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

      await expect(useCase.execute(baseDTO(), OWNER_ID))
        .rejects.toThrow(ReportNotFoundError);
    });

    it('lanza UnauthorizedReportEditError si el usuario no es el dueño', async () => {
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(makeSightingReport() as any);

      await expect(useCase.execute(baseDTO(), OTHER_ID))
        .rejects.toThrow(UnauthorizedReportEditError);
    });

    it('lanza ReportClosedError si el reporte no está activo (resuelto o cerrado)', async () => {
      for (const status of ['RESOLVED', 'CLOSED'] as const) {
        vi.mocked(reportRepository.findByPublicId).mockResolvedValue({ ...makeSightingReport(), status } as any);

        await expect(useCase.execute(baseDTO(), OWNER_ID))
          .rejects.toThrow(ReportClosedError);
      }
    });

    it('lanza InvalidFieldError si occurredAt es una fecha futura', async () => {
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(makeSightingReport() as any);
      const tomorrow = new Date(Date.now() + 86_400_000);

      await expect(useCase.execute(baseDTO({ occurredAt: tomorrow }), OWNER_ID))
        .rejects.toThrow(InvalidFieldError);
    });
  });


  describe('SIGHTING — actualización de campos', () => {
    it('llama updateFields y updateFields del repositorio', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        sightingDetails: { petName: 'Rex', color: 'blanco', hasIdCollar: true },
      }), OWNER_ID);

      expect(report.updateFields).toHaveBeenCalledOnce();
      expect(reportRepository.updateFields).toHaveBeenCalledOnce();
    });

    it('no toca petRepository para un SIGHTING', async () => {
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(makeSightingReport() as any);

      await useCase.execute(baseDTO({ sightingDetails: { color: 'blanco' } }), OWNER_ID);

      expect(petRepository.findByPublicId).not.toHaveBeenCalled();
    });
  });


  describe('SIGHTING — gestión de imágenes', () => {
    it('conserva las imágenes indicadas en keepImageIds', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        sightingDetails: { color: 'negro' },
        keepImageIds: ['reports/img1'],
      }), OWNER_ID);

      expect(storageService.delete).not.toHaveBeenCalled();
      const updateCall = vi.mocked(reportRepository.updateFields).mock.calls[0]!;
      expect(updateCall).toBeDefined();
      const images = updateCall[1]!;
      expect(images).toHaveLength(1);
      expect(images[0]!.cloudinaryId).toBe('reports/img1');
    });

    it('borra de Cloudinary las imágenes que no están en keepImageIds', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        sightingDetails: { color: 'negro' },
        keepImageIds: [],
        newImages: [Buffer.from('new-image')],
      }), OWNER_ID);

      expect(storageService.delete).toHaveBeenCalledWith('reports/img1');
      const images = vi.mocked(reportRepository.updateFields).mock.calls[0]?.[1] ?? [];
      expect(images).toHaveLength(1);
    });

    it('lanza InvalidFieldError si se intenta dejar el reporte sin imágenes', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await expect(useCase.execute(baseDTO({
        keepImageIds: [],
        newImages: [],
      }), OWNER_ID)).rejects.toThrow(InvalidFieldError);
    });

    it('sube imágenes nuevas y las incluye en el update', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      const buffer = Buffer.from('fake-image');
      await useCase.execute(baseDTO({
        sightingDetails: { color: 'negro' },
        keepImageIds: ['reports/img1'],
        newImages: [buffer],
      }), OWNER_ID);

      expect(storageService.upload).toHaveBeenCalledWith(buffer, 'reports');
      const images = vi.mocked(reportRepository.updateFields).mock.calls[0]?.[1] ?? [];
      expect(images).toHaveLength(2);
    });
  });


  describe('LOST — actualización de campos', () => {
    it('renombra la mascota si viene name', async () => {
      const report = makeLostReport();
      const pet = makePet();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);

      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID, name: 'Firulais' },
      }), OWNER_ID);

      expect(pet.rename).toHaveBeenCalledWith('Firulais');
      expect(petRepository.update).toHaveBeenCalledOnce();
      expect(reportRepository.updateFields).toHaveBeenCalledOnce();
    });

    it('actualiza color, raza y collar de la mascota', async () => {
      const report = makeLostReport();
      const pet = makePet();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);

      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID, color: 'gris', breed: 'labrador', hasIdCollar: true },
      }), OWNER_ID);

      expect(pet.updateColor).toHaveBeenCalledWith('gris');
      expect(pet.updateBreed).toHaveBeenCalledWith('labrador');
      expect(pet.updateCollarStatus).toHaveBeenCalledWith(true);
    });

    it('lanza InvalidFieldError si la mascota no existe', async () => {
      const report = makeLostReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(null);

      await expect(useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID },
      }), OWNER_ID)).rejects.toThrow(InvalidFieldError);
    });

    it('lanza UnauthorizedReportEditError si la mascota no pertenece al reporte', async () => {
      const report = makeLostReport();
      const otherPet = { ...makePet(), idPet: 999 };
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(otherPet as any);

      await expect(useCase.execute(baseDTO({
        lostDetails: { petPublicId: 'pet-ajena-uuid' },
      }), OWNER_ID)).rejects.toThrow(UnauthorizedReportEditError);

      expect(petRepository.update).not.toHaveBeenCalled();
    });
  });


  describe('LOST — gestión de imágenes', () => {
    it('lee imágenes del repositorio (no del aggregate) para LOST', async () => {
      const report = makeLostReport();
      const pet = makePet();
      const lostImage = SightingImage.create({ cloudinaryId: 'reports/lost1', photoUrl: 'https://lost1.jpg' });
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);
      vi.mocked(reportRepository.findImagesByReportId).mockResolvedValue([lostImage]);

      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID },
        keepImageIds: ['reports/lost1'],
      }), OWNER_ID);

      expect(reportRepository.findImagesByReportId).toHaveBeenCalledWith(REPORT_ID);
      const images = vi.mocked(reportRepository.updateFields).mock.calls[0]![1];
      expect(images).toHaveLength(1);
    });

    it('borra imágenes de LOST que no están en keepImageIds', async () => {
      const report = makeLostReport();
      const pet = makePet();
      const lostImage = SightingImage.create({ cloudinaryId: 'reports/lost1', photoUrl: 'https://lost1.jpg' });
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);
      vi.mocked(reportRepository.findImagesByReportId).mockResolvedValue([lostImage]);

      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID },
        keepImageIds: [],
        newImages: [Buffer.from('new-image')],
      }), OWNER_ID);

      expect(storageService.delete).toHaveBeenCalledWith('reports/lost1');
      const images = vi.mocked(reportRepository.updateFields).mock.calls[0]![1];
      expect(images).toHaveLength(1);
    });

    it('sube imágenes nuevas para LOST', async () => {
      const report = makeLostReport();
      const pet = makePet();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);
      vi.mocked(reportRepository.findImagesByReportId).mockResolvedValue([]);

      const buffer = Buffer.from('fake');
      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID },
        newImages: [buffer],
      }), OWNER_ID);

      expect(storageService.upload).toHaveBeenCalledWith(buffer, 'reports');
      const images = vi.mocked(reportRepository.updateFields).mock.calls[0]![1];
      expect(images).toHaveLength(1);
    });
  });


  describe('LOST — sin lostDetails', () => {
    it('actualiza campos base e imágenes sin tocar la mascota', async () => {
      const report = makeLostReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(reportRepository.findImagesByReportId).mockResolvedValue([fakeImage]);

      await useCase.execute(baseDTO({ description: 'nueva descripción' }), OWNER_ID);

      expect(petRepository.findByPublicId).not.toHaveBeenCalled();
      expect(report.updateFields).toHaveBeenCalledOnce();
      expect(reportRepository.updateFields).toHaveBeenCalledOnce();
    });
  });

  describe('Detección de cambios y encolado de Matching Job', () => {
    it('no encola job si no hay cambios en campos principales ni imágenes', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO(), OWNER_ID);

      expect(enqueueMatchingJob).not.toHaveBeenCalled();
    });

    it('encola job con DESCRIPTION si cambia la descripción', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({ description: 'Nueva descripción' }), OWNER_ID);

      expect(enqueueMatchingJob).toHaveBeenCalledWith({
        type: TypeJob.REFRESH_MATCHING,
        reportId: report.idReport,
        reportType: 2,
        reportTypeName: ReportType.SIGHTING,
        changes: [DataChangeType.DESCRIPTION],
      });
    });

    it('encola job con LOCATION si cambia la ubicación', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        location: { address: 'Calle Falsa 123', latitude: -34.123, longitude: -58.123 }
      }), OWNER_ID);

      expect(enqueueMatchingJob).toHaveBeenCalledWith({
        type: TypeJob.REFRESH_MATCHING,
        reportId: report.idReport,
        reportType: 2,
        reportTypeName: ReportType.SIGHTING,
        changes: [DataChangeType.LOCATION],
      });
    });

    it('encola job con ATTRIBUTES si cambian atributos de SIGHTING', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        sightingDetails: { petName: 'NuevoNombre', color: 'blanco' }
      }), OWNER_ID);

      expect(enqueueMatchingJob).toHaveBeenCalledWith({
        type: TypeJob.REFRESH_MATCHING,
        reportId: report.idReport,
        reportType: 2,
        reportTypeName: ReportType.SIGHTING,
        changes: [DataChangeType.ATTRIBUTES],
      });
    });

    it('encola job con ATTRIBUTES si cambian atributos del Pet en LOST', async () => {
      const report = makeLostReport();
      const pet = makePet();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);
      vi.mocked(petRepository.findByPublicId).mockResolvedValue(pet as any);

      await useCase.execute(baseDTO({
        lostDetails: { petPublicId: PET_PUB_ID, name: 'NuevoNombre' }
      }), OWNER_ID);

      expect(enqueueMatchingJob).toHaveBeenCalledWith({
        type: TypeJob.REFRESH_MATCHING,
        reportId: report.idReport,
        reportType: 1,
        reportTypeName: ReportType.LOST,
        changes: [DataChangeType.ATTRIBUTES],
      });
    });

    it('encola job con IMAGE si cambian las imágenes', async () => {
      const report = makeSightingReport();
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report as any);

      await useCase.execute(baseDTO({
        keepImageIds: [],
        newImages: [Buffer.from('new-image')],
      }), OWNER_ID);

      expect(enqueueMatchingJob).toHaveBeenCalledWith({
        type: TypeJob.REFRESH_MATCHING,
        reportId: report.idReport,
        reportType: 2,
        reportTypeName: ReportType.SIGHTING,
        changes: [DataChangeType.IMAGE],
      });
    });
  });
});
