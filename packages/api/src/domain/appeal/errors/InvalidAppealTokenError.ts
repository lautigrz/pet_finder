import { DomainError } from "../../errors/DomainError";

export class InvalidAppealTokenError extends DomainError {
  constructor() {
    super("The appeal link is invalid or expired", "INVALID_APPEAL_TOKEN");
  }
}
