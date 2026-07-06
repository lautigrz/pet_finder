import { DomainError } from "@domain/errors/DomainError";

export class ReportAlreadyFeaturedError extends DomainError {
  constructor(publicId: string) {
    super(`Report is already featured with publicId: ${publicId}`, "REPORT_ALREADY_FEATURED");
  }
}
