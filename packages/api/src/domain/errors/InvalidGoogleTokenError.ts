import { DomainError } from "./DomainError";

export class InvalidGoogleTokenError extends DomainError {
  constructor() {
    super("Invalid Google token", "INVALID_GOOGLE_TOKEN");
  }
}
