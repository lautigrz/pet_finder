import { InvalidVerificationTokenError } from "../errors/InvalidVerificationTokenError";
import { assertExpirationInFuture, assertTokenValue } from "../shared/token/token-invariants";

export class EmailVerificationToken {
  private constructor(
    public readonly id: number | null,
    public readonly userId: number,
    public readonly value: string,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(userId: number, value: string, expiresAt: Date): EmailVerificationToken {
    assertTokenValue(value, "Token value too short");
    assertExpirationInFuture(expiresAt);
    return new EmailVerificationToken(null, userId, value, expiresAt, null, new Date());
  }

  static reconstruct(
    id: number,
    userId: number,
    value: string,
    expiresAt: Date,
    usedAt: Date | null,
    createdAt: Date,
  ): EmailVerificationToken {
    return new EmailVerificationToken(id, userId, value, expiresAt, usedAt, createdAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  ensureUsable(): void {
    if (this.isUsed()) throw new InvalidVerificationTokenError("already_used");
    if (this.isExpired()) throw new InvalidVerificationTokenError("expired");
  }

  requireId(): number {
    if (this.id === null) throw new Error("Email verification token is not persisted");
    return this.id;
  }
}
