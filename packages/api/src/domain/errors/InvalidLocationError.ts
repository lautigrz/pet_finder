import { DomainError } from "./DomainError";

export class InvalidLocationError extends DomainError {
  constructor(
    message = "Location is required and must be a valid address",
  ) {
    super(message, "INVALID_LOCATION");
  }
}
