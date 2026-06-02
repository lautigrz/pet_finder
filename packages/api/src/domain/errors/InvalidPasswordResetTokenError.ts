export type InvalidPasswordResetTokenReason = "not_found" | "expired" | "already_used";

export class InvalidPasswordResetTokenError extends Error {
  constructor(public readonly reason: InvalidPasswordResetTokenReason) {
    super(`Invalid password reset token: ${reason}`);
    this.name = "InvalidPasswordResetTokenError";
  }
}
