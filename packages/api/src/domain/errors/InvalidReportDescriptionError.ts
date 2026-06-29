import { DomainError } from "./DomainError";

export class InvalidReportDescriptionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_REPORT_DESCRIPTION");
  }
}
