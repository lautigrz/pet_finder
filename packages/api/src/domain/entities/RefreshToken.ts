import { assertExpirationInFuture, assertTokenValue } from "../shared/token/token-invariants";

export class RefreshToken {
  private constructor(
    public readonly id: number | null,
    public readonly userId: number,
    public readonly value: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(userId: number, value: string, expiresAt: Date): RefreshToken {
    assertTokenValue(value, "Refresh token value too short");
    assertExpirationInFuture(expiresAt);
    return new RefreshToken(null, userId, value, expiresAt, null, new Date());
  }

  static reconstruct(
    id: number,
    userId: number,
    value: string,
    expiresAt: Date,
    revokedAt: Date | null,
    createdAt: Date,
  ): RefreshToken {
    return new RefreshToken(id, userId, value, expiresAt, revokedAt, createdAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isActive(): boolean {
    return !this.isRevoked() && !this.isExpired();
  }

  requireId(): number {
    if (this.id === null) throw new Error("Refresh token is not persisted");
    return this.id;
  }
}
