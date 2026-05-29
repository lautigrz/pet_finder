import { SignOptions } from "jsonwebtoken";

const TIME_UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export interface AuthConfig {
  jwtSecret: string;
  accessTtl: SignOptions["expiresIn"];
  refreshTtlMs: number;
}

export function readAuthConfig(): AuthConfig {
  const jwtSecret = required("JWT_SECRET");
  const accessTtl = required("JWT_ACCESS_TTL") as SignOptions["expiresIn"];
  const refreshTtl = required("JWT_REFRESH_TTL");
  return { jwtSecret, accessTtl, refreshTtlMs: parseDuration(refreshTtl) };
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

function parseDuration(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim());
  if (!match) throw new Error(`Invalid duration: ${input}`);
  return Number(match[1]) * TIME_UNIT_MS[match[2]!]!;
}
