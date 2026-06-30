import { DomainError } from "@domain/errors/DomainError";

export class ContentReportNotFoundError extends DomainError {
  constructor() {
    super("Content report not found", "CONTENT_REPORT_NOT_FOUND");
  }
}
