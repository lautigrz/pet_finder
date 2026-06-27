import { DomainError } from "@domain/errors/DomainError";

export class CannotReportOwnContentError extends DomainError {
  constructor() {
    super("You cannot report your own content", "CANNOT_REPORT_OWN_CONTENT");
  }
}
