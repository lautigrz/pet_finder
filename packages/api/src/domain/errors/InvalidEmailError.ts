import { DomainError } from "./DomainError";

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`, "INVALID_EMAIL");
  }
}
