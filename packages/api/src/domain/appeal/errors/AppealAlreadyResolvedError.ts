import { DomainError } from "../../errors/DomainError";

export class AppealAlreadyResolvedError extends DomainError {
  constructor() {
    super("This appeal was already resolved", "APPEAL_ALREADY_RESOLVED");
  }
}
