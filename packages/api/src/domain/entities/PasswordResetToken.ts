export class PasswordResetToken {
  private constructor(
    public readonly id: number | null,
    public readonly userId: number,
    public readonly value: string,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(userId: number, value: string, expiresAt: Date): PasswordResetToken {
    PasswordResetToken.assertValidValue(value);
    PasswordResetToken.assertExpirationInFuture(expiresAt);
    return new PasswordResetToken(null, userId, value, expiresAt, null, new Date());
  }

  static reconstruct(
    id: number,
    userId: number,
    value: string,
    expiresAt: Date,
    usedAt: Date | null,
    createdAt: Date,
  ): PasswordResetToken {
    return new PasswordResetToken(id, userId, value, expiresAt, usedAt, createdAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  private static assertValidValue(value: string): void {
    if (value.length < 32) throw new Error("Password reset token value too short");
  }

  private static assertExpirationInFuture(expiresAt: Date): void {
    if (expiresAt <= new Date()) throw new Error("Expiration must be in the future");
  }
}
