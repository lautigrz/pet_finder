import { InvalidPasswordResetTokenError } from "../errors/InvalidPasswordResetTokenError";
import { assertExpirationInFuture, assertTokenValue } from "../shared/token/token-invariants";

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
    assertTokenValue(value, "Password reset token value too short");
    assertExpirationInFuture(expiresAt);
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

  ensureUsable(): void {
    if (this.isUsed()) throw new InvalidPasswordResetTokenError("already_used");
    if (this.isExpired()) throw new InvalidPasswordResetTokenError("expired");
  }

  requireId(): number {
    if (this.id === null) throw new Error("Password reset token is not persisted");
    return this.id;
  }
}
