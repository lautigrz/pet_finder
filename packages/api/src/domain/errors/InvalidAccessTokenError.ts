import { DomainError } from "./DomainError";

export class InvalidAccessTokenError extends DomainError {
  constructor() {
    super("Invalid or expired access token", "INVALID_ACCESS_TOKEN");
  }
}
