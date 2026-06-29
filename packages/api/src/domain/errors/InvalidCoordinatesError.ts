import { DomainError } from "./DomainError";

export class InvalidCoordinatesError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_COORDINATES");
  }
}
