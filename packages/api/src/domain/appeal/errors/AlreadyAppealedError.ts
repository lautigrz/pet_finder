import { DomainError } from "../../errors/DomainError";

export class AlreadyAppealedError extends DomainError {
  constructor() {
    super("This case has already been appealed", "ALREADY_APPEALED");
  }
}
