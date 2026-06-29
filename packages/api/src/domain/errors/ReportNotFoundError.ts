import { DomainError } from "./DomainError";

export class ReportNotFoundError extends DomainError {
  constructor(publicId: string) {
    super(`Report not found with publicId: ${publicId}`, "REPORT_NOT_FOUND");
  }
}
