import { DomainError } from "@domain/errors/DomainError";

export class ValidationError extends DomainError {
  constructor(public readonly issues: string[]) {
    super(`Invalid input: ${issues.join("; ")}`, "VALIDATION_ERROR");
  }
}
