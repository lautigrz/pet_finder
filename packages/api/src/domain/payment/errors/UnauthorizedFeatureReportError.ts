import { DomainError } from "@domain/errors/DomainError";

export class UnauthorizedFeatureReportError extends DomainError {
  constructor() {
    super("You are not authorized to feature this report", "UNAUTHORIZED_FEATURE_REPORT");
  }
}
