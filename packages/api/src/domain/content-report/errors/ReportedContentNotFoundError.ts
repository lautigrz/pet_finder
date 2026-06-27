import { DomainError } from "@domain/errors/DomainError";

export class ReportedContentNotFoundError extends DomainError {
  constructor() {
    super("Reported content not found", "REPORTED_CONTENT_NOT_FOUND");
  }
}
