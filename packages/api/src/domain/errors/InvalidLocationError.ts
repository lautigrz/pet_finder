import { DomainError } from "./DomainError";

export class InvalidLocationError extends DomainError {
  constructor() {
    super("Location is required and must be a valid address", "INVALID_LOCATION");
  }
}
