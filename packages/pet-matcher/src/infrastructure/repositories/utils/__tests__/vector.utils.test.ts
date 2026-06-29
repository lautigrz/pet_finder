import { describe, it, expect } from 'vitest';
import { toVectorLiteral, parseVector, groupBy } from '@infrastructure/repositories/utils/vector.utils';

describe('toVectorLiteral', () => {
  it('convierte un array de números al formato [x,y,z]', () => {
    expect(toVectorLiteral([1, 2, 3])).toBe('[1,2,3]');
  });

  it('maneja un array vacío', () => {
    expect(toVectorLiteral([])).toBe('[]');
  });

  it('maneja decimales', () => {
    expect(toVectorLiteral([0.1, 0.5, -0.3])).toBe('[0.1,0.5,-0.3]');
  });
});

describe('parseVector', () => {
  it('parsea un string JSON de vector correctamente', () => {
    expect(parseVector('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('retorna null si el valor es null', () => {
    expect(parseVector(null)).toBeNull();
  });

  it('retorna null si el valor es undefined', () => {
    expect(parseVector(undefined)).toBeNull();
  });

  it('retorna null si el string está vacío', () => {
    expect(parseVector('')).toBeNull();
  });

  it('retorna null si el JSON es inválido', () => {
    expect(parseVector('not-json')).toBeNull();
  });

  it('parsea un vector con decimales', () => {
    const result = parseVector('[0.1,0.2,0.3]');
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(0.1);
  });
});

describe('groupBy', () => {
  it('agrupa items por clave numérica', () => {
    const items = [
      { id: 1, val: 'a' },
      { id: 2, val: 'b' },
      { id: 1, val: 'c' },
    ];
    const result = groupBy(items, (i) => i.id);
    expect(result.get(1)).toEqual([
      { id: 1, val: 'a' },
      { id: 1, val: 'c' },
    ]);
    expect(result.get(2)).toEqual([{ id: 2, val: 'b' }]);
  });

  it('retorna un Map vacío si el array está vacío', () => {
    const result = groupBy([], (i: any) => i.id);
    expect(result.size).toBe(0);
  });

  it('agrupa todos los items bajo la misma clave si son iguales', () => {
    const items = [{ id: 5 }, { id: 5 }];
    const result = groupBy(items, (i) => i.id);
    expect(result.get(5)?.length).toBe(2);
  });
});
