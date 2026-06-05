import { describe, it, expect } from 'vitest';
import { updateReportSchema } from '../update-report.schema';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function parse(body: unknown) {
  return updateReportSchema.safeParse({
    params: { publicId: VALID_UUID },
    body,
  });
}

describe('updateReportSchema', () => {

  it('acepta un body completamente vacío (todos los campos opcionales)', () => {
    const r = parse({});
    expect(r.success).toBe(true);
  });

  it('acepta description y occurredAt válidos', () => {
    const r = parse({ description: 'hola', occurredAt: '2024-05-01T10:00:00.000Z' });
    expect(r.success).toBe(true);
  });

  it('rechaza publicId con formato incorrecto', () => {
    const r = updateReportSchema.safeParse({
      params: { publicId: 'no-es-uuid' },
      body: {},
    });
    expect(r.success).toBe(false);
  });

  it('acepta sightingDetails completo', () => {
    const r = parse({
      sightingDetails: {
        petName: 'Rex',
        animalType: 'DOG',
        genderType: 'MALE',
        sizeType: 'MEDIUM',
        breed: 'Labrador',
        hasIdCollar: true,
        color: 'negro',
        isInTransit: false,
      },
    });
    expect(r.success).toBe(true);
  });

  it('acepta sightingDetails con campos nullable', () => {
    const r = parse({
      sightingDetails: { petName: null, genderType: null, sizeType: null, breed: null },
    });
    expect(r.success).toBe(true);
  });

  it('rechaza sightingDetails con animalType inválido', () => {
    const r = parse({ sightingDetails: { animalType: 'BIRD' } });
    expect(r.success).toBe(false);
  });

  it('acepta lostDetails con petPublicId válido', () => {
    const r = parse({ lostDetails: { petPublicId: VALID_UUID } });
    expect(r.success).toBe(true);
  });

  it('rechaza lostDetails sin petPublicId', () => {
    const r = parse({ lostDetails: { name: 'Firulais' } });
    expect(r.success).toBe(false);
  });

  it('rechaza lostDetails con petPublicId que no es uuid', () => {
    const r = parse({ lostDetails: { petPublicId: 'no-uuid' } });
    expect(r.success).toBe(false);
  });

  it('acepta keepImageIds como array de strings', () => {
    const r = parse({ keepImageIds: ['reports/img1', 'reports/img2'] });
    expect(r.success).toBe(true);
  });

  it('acepta keepImageIds como JSON string (viene de FormData)', () => {
    const r = parse({ keepImageIds: JSON.stringify(['reports/img1']) });
    expect(r.success).toBe(true);
  });

  it('acepta keepImageIds vacío', () => {
    const r = parse({ keepImageIds: [] });
    expect(r.success).toBe(true);
  });

  it('coerce occurredAt de string a Date', () => {
    const r = parse({ occurredAt: '2024-05-01T10:00:00.000Z' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body.occurredAt).toBeInstanceOf(Date);
  });
});
