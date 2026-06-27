import { DomainError } from "@domain/errors/DomainError";

export class ContentAlreadyReportedError extends DomainError {
  constructor() {
    super("You already reported this content", "CONTENT_ALREADY_REPORTED");
  }
}
