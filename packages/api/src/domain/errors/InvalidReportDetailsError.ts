import { DomainError } from "./DomainError";

export class InvalidReportDetailsError extends DomainError {
  constructor(type: string, expectedClass: string) {
    super(`Report of type "${type}" requires ${expectedClass}`, "INVALID_REPORT_DETAILS");
  }
}
