import { DomainError } from "@domain/errors/DomainError";

export class InvalidReportReasonError extends DomainError {
  constructor(reason: string, targetType: string) {
    super(`Reason "${reason}" is not valid for target type "${targetType}"`, "INVALID_REPORT_REASON");
  }
}
