import { DomainError } from "./DomainError";

export class GoogleEmailNotVerifiedError extends DomainError {
  constructor() {
    super("Google account email is not verified", "GOOGLE_EMAIL_NOT_VERIFIED");
  }
}
