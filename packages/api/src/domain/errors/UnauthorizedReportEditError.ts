import { DomainError } from "./DomainError";

export class UnauthorizedReportEditError extends DomainError {
  constructor() {
    super('You are not authorized to edit this report', "UNAUTHORIZED_REPORT_EDIT");
  }
}