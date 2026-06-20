import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RunMatchingUseCase } from '@application/use-cases/run-matching.use-case';
import { IReportRepository } from '@domain/repositories/report.repository';
import { IPetRepository } from '@domain/repositories/pet.repository';
import { MatchingDomainService } from '@domain/services/matching.domain-service';
import { ReportEntity } from '@domain/entities/report.entity';
import { IMatchNotifier } from '@domain/services/match-notifier';

vi.mock('@services/embedding-images-services', () => ({
  extractEmbedding: vi.fn().mockResolvedValue([1, 0, 0]),
}));

vi.mock('@services/embedding-description-services', () => ({
  extractDescriptionEmbedding: vi.fn().mockResolvedValue([0, 1, 0]),
}));


function makeReport(overrides: Partial<ReportEntity> = {}): ReportEntity {
  return {
    reportId: 1,
    publicId: 'pub-1',
    reportTypeId: 1,
    reportStatusId: 1,
    description: null,
    embeddingDescription: null,
    images: [],
    location: { locationLat: -34.6, locationLng: -58.4 },
    details: { hasIdIdentification: false },
    ...overrides,
  };
}


function makeReportRepo(overrides: Partial<IReportRepository> = {}): IReportRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeReport()),
    findCandidatesReportsActives: vi.fn().mockResolvedValue([]),
    updateDescriptionEmbedding: vi.fn().mockResolvedValue(undefined),
    updateImageEmbedding: vi.fn().mockResolvedValue(undefined),
    saveMatchResults: vi.fn().mockResolvedValue(undefined),
    findMatchNotifications: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makePetRepo(overrides: Partial<IPetRepository> = {}): IPetRepository {
  return {
    updateImageEmbedding: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeNotifier(overrides: Partial<IMatchNotifier> = {}): IMatchNotifier {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}


const LOST_TYPE = 1;
const SIGHTING_TYPE = 2;

describe('RunMatchingUseCase', () => {
  let reportRepo: IReportRepository;
  let petRepo: IPetRepository;
  let matchingService: MatchingDomainService;
  let matchNotifier: IMatchNotifier;
  let useCase: RunMatchingUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    reportRepo = makeReportRepo();
    petRepo = makePetRepo();
    matchingService = new MatchingDomainService();
    matchNotifier = makeNotifier();
    useCase = new RunMatchingUseCase(reportRepo, petRepo, matchingService, matchNotifier);
  });


  describe('cuando el reporte no existe', () => {
    it('lanza un error con el id del reporte', async () => {
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(useCase.execute(999, LOST_TYPE)).rejects.toThrow('Report not found: 999');
    });
  });

  describe('sin imágenes ni descripción', () => {
    it('retorna array vacío si no hay candidatos', async () => {
      const results = await useCase.execute(1, LOST_TYPE);
      expect(results).toEqual([]);
    });

    it('llama a findById con el id correcto', async () => {
      await useCase.execute(1, LOST_TYPE);
      expect(reportRepo.findById).toHaveBeenCalledWith(1);
    });

    it('llama a findCandidatesReportsActives con los datos del reporte', async () => {
      const report = makeReport();
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
      await useCase.execute(1, LOST_TYPE);
      expect(reportRepo.findCandidatesReportsActives).toHaveBeenCalledWith(
        report.reportId,
        report.details,
        report.location,
      );
    });

    it('llama a saveMatchResults con el reportId correcto', async () => {
      await useCase.execute(1, LOST_TYPE);
      expect(reportRepo.saveMatchResults).toHaveBeenCalledWith(1, []);
    });
  });

  describe('procesamiento de imágenes', () => {
    const imageWithoutEmb = { imageId: 10, photoUrl: 'https://example.com/img.jpg', embeddingPhoto: null };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }));
    });

    it('para reporte LOST actualiza el embedding en petRepository', async () => {
      const report = makeReport({ images: [imageWithoutEmb] });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

      await useCase.execute(1, LOST_TYPE);

      expect(petRepo.updateImageEmbedding).toHaveBeenCalledWith(10, [1, 0, 0]);
    });

    it('para reporte SIGHTING no llama a petRepository sino a reportRepository', async () => {

      const reportWithEmbedding = makeReport({
        images: [{ imageId: 10, photoUrl: 'x', embeddingPhoto: [1, 0, 0] }],
      });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(reportWithEmbedding);

      await useCase.execute(1, SIGHTING_TYPE);

      expect(petRepo.updateImageEmbedding).not.toHaveBeenCalled();
      expect(reportRepo.updateImageEmbedding).not.toHaveBeenCalled();
    });

    it('no llama a extractEmbedding si la imagen ya tiene embedding', async () => {
      const { extractEmbedding } = await import('@services/embedding-images-services');
      const report = makeReport({ images: [{ imageId: 10, photoUrl: 'x', embeddingPhoto: [1, 0, 0] }] });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

      await useCase.execute(1, LOST_TYPE);

      expect(extractEmbedding).not.toHaveBeenCalled();
    });
  });


  describe('procesamiento de descripción', () => {
    it('genera y persiste el embedding si el reporte tiene descripción pero no embedding', async () => {
      const report = makeReport({ description: 'perro negro grande', embeddingDescription: null });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

      await useCase.execute(1, LOST_TYPE);

      expect(reportRepo.updateDescriptionEmbedding).toHaveBeenCalledWith(1, [0, 1, 0]);
    });

    it('no genera embedding si ya existe embeddingDescription', async () => {
      const { extractDescriptionEmbedding } = await import('@services/embedding-description-services');
      const report = makeReport({ description: 'perro negro', embeddingDescription: [0, 1, 0] });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

      await useCase.execute(1, LOST_TYPE);

      expect(extractDescriptionEmbedding).not.toHaveBeenCalled();
      expect(reportRepo.updateDescriptionEmbedding).not.toHaveBeenCalled();
    });

    it('no genera embedding si la descripción es null', async () => {
      const { extractDescriptionEmbedding } = await import('@services/embedding-description-services');
      const report = makeReport({ description: null, embeddingDescription: null });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

      await useCase.execute(1, LOST_TYPE);

      expect(extractDescriptionEmbedding).not.toHaveBeenCalled();
    });
  });


  describe('ranking y persistencia de resultados', () => {
    it('retorna los resultados ordenados por score', async () => {
      const candidate1 = makeReport({ reportId: 2, publicId: 'pub-2', embeddingDescription: [0, 1, 0] });
      const candidate2 = makeReport({ reportId: 3, publicId: 'pub-3', embeddingDescription: [1, 0, 0] });

      const source = makeReport({ embeddingDescription: [0, 1, 0] });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(source);
      (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>).mockResolvedValue([candidate2, candidate1]);

      const results = await useCase.execute(1, LOST_TYPE);

      expect(results[0]!.publicId).toBe('pub-2');
      expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
    });

    it('guarda los resultados llamando a saveMatchResults', async () => {
      const candidate = makeReport({ reportId: 2, publicId: 'pub-2' });
      (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>).mockResolvedValue([candidate]);

      await useCase.execute(1, LOST_TYPE);

      expect(reportRepo.saveMatchResults).toHaveBeenCalledOnce();
      const [savedId, savedResults]: any = (reportRepo.saveMatchResults as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(savedId).toBe(1);
      expect(savedResults).toHaveLength(1);
    });
  });


  describe('notificaciones de coincidencias', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }));
    });

    it('publica una notificacion cuando la coincidencia supera el umbral de score', async () => {
      const source = makeReport({ images: [{ imageId: 1, photoUrl: 'a', embeddingPhoto: [1, 0, 0] }] });
      const candidate = makeReport({ reportId: 2, publicId: 'pub-2', images: [{ imageId: 2, photoUrl: 'b', embeddingPhoto: [1, 0, 0] }] });
      (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(source);
      (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>).mockResolvedValue([candidate]);

      const notification = {
        ownerPublicId: 'owner-1',
        lostReportPublicId: 'pub-1',
        lostPetName: 'Mandarina',
        matchPublicId: 'match-1',
        matchedReportPublicId: 'pub-2',
        matchedImage: 'b',
        score: 0.71,
        createdAt: '2026-06-19T18:00:00.000Z',
      };
      (reportRepo.findMatchNotifications as ReturnType<typeof vi.fn>).mockResolvedValue([notification]);

      await useCase.execute(1, LOST_TYPE);

      expect(reportRepo.findMatchNotifications).toHaveBeenCalledWith(1, [2]);
      expect(matchNotifier.publish).toHaveBeenCalledWith(notification);
    });

    it('no publica notificaciones cuando los scores estan por debajo del umbral', async () => {
      const candidate = makeReport({ reportId: 2, publicId: 'pub-2' });
      (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>).mockResolvedValue([candidate]);

      await useCase.execute(1, LOST_TYPE);

      expect(reportRepo.findMatchNotifications).not.toHaveBeenCalled();
      expect(matchNotifier.publish).not.toHaveBeenCalled();
    });
  });
});
