import { DomainError } from "./DomainError";

export type InvalidPasswordResetTokenReason = "not_found" | "expired" | "already_used";

export class InvalidPasswordResetTokenError extends DomainError {
  constructor(public readonly reason: InvalidPasswordResetTokenReason) {
    super(`Invalid password reset token: ${reason}`, "INVALID_PASSWORD_RESET_TOKEN");
  }
}
