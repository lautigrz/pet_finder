import { DomainError } from "./DomainError";

export class InvalidUsernameError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_USERNAME");
  }
}
