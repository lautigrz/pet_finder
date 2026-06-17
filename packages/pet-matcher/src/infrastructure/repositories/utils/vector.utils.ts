import { logger } from '@pet-alert/shared';

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export function parseVector(raw: string | null | undefined): number[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      logger.warn(
        `[parseVector] Expected a JSON array but got a different type — value (truncated): ${raw.slice(0, 80)} — returning null`,
      );
      return null;
    }
    return parsed as number[];
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`[parseVector] Failed to parse vector string from DB — value (truncated): ${raw.slice(0, 80)} — error: ${errMsg}`);
    return null;
  }
}

export function groupBy<T>(items: T[], key: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k) ?? [];
    arr.push(item);
    map.set(k, arr);
  }
  return map;
}
