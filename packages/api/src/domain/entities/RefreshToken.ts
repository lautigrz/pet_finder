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
    RefreshToken.assertValidValue(value);
    RefreshToken.assertExpirationInFuture(expiresAt);
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

  private static assertValidValue(value: string): void {
    if (value.length < 32) throw new Error("Refresh token value too short");
  }

  private static assertExpirationInFuture(expiresAt: Date): void {
    if (expiresAt <= new Date()) throw new Error("Expiration must be in the future");
  }
}
