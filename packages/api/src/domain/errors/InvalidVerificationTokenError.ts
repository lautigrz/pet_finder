export type InvalidVerificationTokenReason = "not_found" | "expired" | "already_used";

export class InvalidVerificationTokenError extends Error {
  constructor(public readonly reason: InvalidVerificationTokenReason) {
    super(`Invalid verification token: ${reason}`);
    this.name = "InvalidVerificationTokenError";
  }
}
