import { DomainError } from "../../errors/DomainError";

export class AppealNotFoundError extends DomainError {
  constructor() {
    super("Appeal not found", "APPEAL_NOT_FOUND");
  }
}
