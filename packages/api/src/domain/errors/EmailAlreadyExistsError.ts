import { DomainError } from "./DomainError";

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email already registered: ${email}`, "EMAIL_ALREADY_EXISTS");
  }
}
