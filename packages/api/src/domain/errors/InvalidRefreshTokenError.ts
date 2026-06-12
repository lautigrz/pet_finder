import { DomainError } from "./DomainError";

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super("Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }
}
