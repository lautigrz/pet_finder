import { describe, it, expect } from 'vitest';
import { l2Normalize, cosineSimilarity, embeddingToSQL } from '../normalize';

describe('l2Normalize', () => {
  it('normaliza un vector a longitud 1', () => {
    const result = l2Normalize([3, 4]);
    expect(result[0]).toBeCloseTo(0.6);
    expect(result[1]).toBeCloseTo(0.8);
  });

  it('retorna el vector original si la norma es 0', () => {
    const result = l2Normalize([0, 0, 0]);
    expect(result).toEqual([0, 0, 0]);
  });

  it('normaliza un vector unitario correctamente', () => {
    const result = l2Normalize([1, 0, 0]);
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  it('maneja vectores con valores negativos', () => {
    const result = l2Normalize([-3, 4]);
    expect(result[0]).toBeCloseTo(-0.6);
    expect(result[1]).toBeCloseTo(0.8);
  });

  it('normaliza un vector de un solo elemento', () => {
    const result = l2Normalize([5]);
    expect(result[0]).toBeCloseTo(1);
  });
});

describe('cosineSimilarity', () => {
  it('devuelve 1 para vectores idénticos normalizados', () => {
    const v = l2Normalize([1, 2, 3]);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it('devuelve 0 para vectores ortogonales', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('devuelve -1 para vectores opuestos normalizados', () => {
    const a = l2Normalize([1, 0]);
    const b = l2Normalize([-1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
  });

  it('lanza error si los vectores tienen distinta longitud', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
      'cosineSimilarity: dimension mismatch',
    );
  });

  it('calcula correctamente para vectores arbitrarios', () => {
    // cos([3,4], [4,3]) = (12+12)/(5*5) = 24/25 = 0.96
    const a = l2Normalize([3, 4]);
    const b = l2Normalize([4, 3]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(24 / 25);
  });
});

describe('embeddingToSQL', () => {
  it('convierte un array a formato SQL vector', () => {
    expect(embeddingToSQL([0.1, 0.2, 0.3])).toBe('[0.1,0.2,0.3]');
  });

  it('maneja un array vacío', () => {
    expect(embeddingToSQL([])).toBe('[]');
  });

  it('maneja un solo elemento', () => {
    expect(embeddingToSQL([1])).toBe('[1]');
  });
});
