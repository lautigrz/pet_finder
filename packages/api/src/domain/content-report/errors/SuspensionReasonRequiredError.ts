import { DomainError } from "@domain/errors/DomainError";

export class SuspensionReasonRequiredError extends DomainError {
  constructor() {
    super("A suspension reason is required", "SUSPENSION_REASON_REQUIRED");
  }
}
