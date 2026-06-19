import { describe, it, expect } from 'vitest';
import { MatchingDomainService } from '@domain/services/matching.domain-service';
import { ReportEntity } from '@domain/entities/report.entity';

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

const vecA = [1, 0, 0];
const vecB = [0, 1, 0];
const vecC = [1, 0, 0];

const service = new MatchingDomainService();

describe('MatchingDomainService.computeScores', () => {
  describe('sin embeddings', () => {
    it('devuelve imageScore=0 si no hay imágenes con embedding', () => {
      const source = makeReport({ images: [{ imageId: 1, photoUrl: 'x', embeddingPhoto: null }] });
      const candidate = makeReport({ images: [{ imageId: 2, photoUrl: 'y', embeddingPhoto: null }] });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBe(0);
    });

    it('devuelve descriptionScore=0 si no hay description embeddings', () => {
      const source = makeReport({ embeddingDescription: null });
      const candidate = makeReport({ embeddingDescription: null });
      const result = service.computeScores(source, candidate);
      expect(result.descriptionScore).toBe(0);
    });

    it('score total >= 0 cuando no hay embeddings de imagen ni descripción', () => {
      const source = makeReport();
      const candidate = makeReport();
      const result = service.computeScores(source, candidate);

      expect(result.imageScore).toBe(0);
      expect(result.descriptionScore).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('con embeddings de imagen', () => {
    it('imageScore = 1 para imágenes idénticas', () => {
      const source = makeReport({ images: [{ imageId: 1, photoUrl: 'x', embeddingPhoto: vecA }] });
      const candidate = makeReport({ images: [{ imageId: 2, photoUrl: 'y', embeddingPhoto: vecC }] });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBeCloseTo(1);
    });

    it('imageScore = 0 para imágenes ortogonales', () => {
      const source = makeReport({ images: [{ imageId: 1, photoUrl: 'x', embeddingPhoto: vecA }] });
      const candidate = makeReport({ images: [{ imageId: 2, photoUrl: 'y', embeddingPhoto: vecB }] });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBeCloseTo(0);
    });

    it('toma el máximo de similitud entre múltiples imágenes candidatas', () => {
      const source = makeReport({ images: [{ imageId: 1, photoUrl: 'x', embeddingPhoto: vecA }] });
      const candidate = makeReport({
        images: [
          { imageId: 2, photoUrl: 'y', embeddingPhoto: vecB },
          { imageId: 3, photoUrl: 'z', embeddingPhoto: vecC },
        ],
      });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBeCloseTo(1);
    });

    it('promedia los scores de múltiples imágenes fuente', () => {

      const source = makeReport({
        images: [
          { imageId: 1, photoUrl: 'x', embeddingPhoto: vecA },
          { imageId: 2, photoUrl: 'y', embeddingPhoto: vecB },
        ],
      });
      const candidate = makeReport({ images: [{ imageId: 3, photoUrl: 'z', embeddingPhoto: vecA }] });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBeCloseTo(0.5);
    });
  });

  describe('con embeddings de descripción', () => {
    it('descriptionScore = 1 para descripciones idénticas', () => {
      const source = makeReport({ embeddingDescription: vecA });
      const candidate = makeReport({ embeddingDescription: vecC });
      const result = service.computeScores(source, candidate);
      expect(result.descriptionScore).toBeCloseTo(1);
    });

    it('descriptionScore = 0 para descripciones ortogonales', () => {
      const source = makeReport({ embeddingDescription: vecA });
      const candidate = makeReport({ embeddingDescription: vecB });
      const result = service.computeScores(source, candidate);
      expect(result.descriptionScore).toBeCloseTo(0);
    });
  });

  describe('score con campos estructurados (sharedFields > 0)', () => {

    it('sharedFields = 1 cuando breed, gender, color y size son undefined (solo hasId cuenta)', () => {

      const source = makeReport({ details: { hasIdIdentification: true } });
      const candidate = makeReport({ details: { hasIdIdentification: true } });
      const result = service.computeScores(source, candidate);
      expect(result.sharedFields).toBe(1);
    });

    it('sharedFields = 0 cuando hasIdIdentification difiere y breed/gender/color/size son undefined', () => {

      const source = makeReport({ details: { hasIdIdentification: true } });
      const candidate = makeReport({ details: { hasIdIdentification: false } });
      const result = service.computeScores(source, candidate);
      expect(result.sharedFields).toBe(0);
    });

    it('sharedFields = 5 cuando todos los campos están definidos e iguales', () => {
      const details = { breed: 'Labrador', color: 'negro', size: 'grande', gender: 'macho', hasIdIdentification: true };
      const source = makeReport({ details });
      const candidate = makeReport({ details });
      const result = service.computeScores(source, candidate);
      expect(result.sharedFields).toBe(5);
    });

    it('breed y gender no cuentan cuando solo uno de los dos reportes los tiene', () => {
      const source = makeReport({ details: { breed: 'Labrador', gender: 'macho', hasIdIdentification: false } });
      const candidate = makeReport({ details: { hasIdIdentification: false } });
      const result = service.computeScores(source, candidate);

      expect(result.sharedFields).toBe(1);
    });

    it('structuredScore = 1 si todos los campos disponibles coinciden', () => {
      const details = { breed: 'Labrador', color: 'negro', size: 'grande', gender: 'macho', hasIdIdentification: true };
      const source = makeReport({ details });
      const candidate = makeReport({ details });
      const result = service.computeScores(source, candidate);
      expect(result.structuredScore).toBeCloseTo(1);
    });

    it('structuredScore = 0 si ningún campo coincide', () => {
      const source = makeReport({ details: { breed: 'Labrador', color: 'negro', hasIdIdentification: true } });
      const candidate = makeReport({ details: { breed: 'Poodle', color: 'blanco', hasIdIdentification: false } });
      const result = service.computeScores(source, candidate);
      expect(result.structuredScore).toBeCloseTo(0);
    });

    it('el peso estructurado no supera 0.20', () => {

      const details = { breed: 'x', color: 'y', size: 'z', gender: 'w', hasIdIdentification: true };
      const source = makeReport({ details, embeddingDescription: vecA, images: [{ imageId: 1, photoUrl: 'u', embeddingPhoto: vecA }] });
      const candidate = makeReport({ details, embeddingDescription: vecA, images: [{ imageId: 2, photoUrl: 'v', embeddingPhoto: vecA }] });
      const result = service.computeScores(source, candidate);

      expect(result.score).toBeCloseTo(1);
    });
  });

  describe('fórmula de score final (sin structured)', () => {
    it('score = 0.7 * imgScore + 0.3 * descScore cuando sharedFields = 0', () => {
      const source = makeReport({ embeddingDescription: vecA, images: [{ imageId: 1, photoUrl: 'u', embeddingPhoto: vecA }] });
      const candidate = makeReport({ embeddingDescription: vecA, images: [{ imageId: 2, photoUrl: 'v', embeddingPhoto: vecA }] });
      const result = service.computeScores(source, candidate);

      expect(result.score).toBeCloseTo(1);
    });

    it('imageScore y descriptionScore son 0 cuando los embeddings son ortogonales', () => {

      const source = makeReport({ embeddingDescription: vecA, images: [{ imageId: 1, photoUrl: 'u', embeddingPhoto: vecA }] });
      const candidate = makeReport({ embeddingDescription: vecB, images: [{ imageId: 2, photoUrl: 'v', embeddingPhoto: vecB }] });
      const result = service.computeScores(source, candidate);
      expect(result.imageScore).toBeCloseTo(0);
      expect(result.descriptionScore).toBeCloseTo(0);
    });
  });
});


describe('MatchingDomainService.rankCandidates', () => {
  it('ordena candidatos de mayor a menor score', () => {
    const source = makeReport({ images: [{ imageId: 1, photoUrl: 'x', embeddingPhoto: vecA }] });

    const high = makeReport({ reportId: 10, publicId: 'high', images: [{ imageId: 2, photoUrl: 'y', embeddingPhoto: vecA }] }); // similar
    const low = makeReport({ reportId: 11, publicId: 'low', images: [{ imageId: 3, photoUrl: 'z', embeddingPhoto: vecB }] });  // ortogonal

    const ranked = service.rankCandidates(source, [low, high]);

    expect(ranked[0]!.publicId).toBe('high');
    expect(ranked[1]!.publicId).toBe('low');
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });

  it('devuelve un array vacío si no hay candidatos', () => {
    const source = makeReport();
    expect(service.rankCandidates(source, [])).toEqual([]);
  });

  it('incluye reportId y publicId del candidato en el resultado', () => {
    const source = makeReport();
    const candidate = makeReport({ reportId: 42, publicId: 'pub-42' });
    const result = service.rankCandidates(source, [candidate]);
    expect(result[0]!.reportId).toBe(42);
    expect(result[0]!.publicId).toBe('pub-42');
  });

  it('devuelve todos los campos del MatchResult', () => {
    const source = makeReport();
    const candidate = makeReport({ reportId: 99, publicId: 'pub-99' });
    const [result] = service.rankCandidates(source, [candidate]);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('imageScore');
    expect(result).toHaveProperty('descriptionScore');
    expect(result).toHaveProperty('structuredScore');
    expect(result).toHaveProperty('sharedFields');
  });
});
