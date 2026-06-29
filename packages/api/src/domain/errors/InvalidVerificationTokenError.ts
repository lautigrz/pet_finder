import { DomainError } from "./DomainError";

export type InvalidVerificationTokenReason = "not_found" | "expired" | "already_used";

export class InvalidVerificationTokenError extends DomainError {
  constructor(public readonly reason: InvalidVerificationTokenReason) {
    super(`Invalid verification token: ${reason}`, "INVALID_VERIFICATION_TOKEN");
  }
}
