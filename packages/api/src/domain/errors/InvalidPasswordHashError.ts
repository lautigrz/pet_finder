import { DomainError } from "./DomainError";

export class InvalidPasswordHashError extends DomainError {
  constructor() {
    super("Invalid password hash", "INVALID_PASSWORD_HASH");
  }
}
