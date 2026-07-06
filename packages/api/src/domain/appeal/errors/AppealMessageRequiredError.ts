import { DomainError } from "../../errors/DomainError";

export class AppealMessageRequiredError extends DomainError {
  constructor() {
    super("The appeal message is required", "APPEAL_MESSAGE_REQUIRED");
  }
}
