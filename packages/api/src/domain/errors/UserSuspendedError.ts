import { DomainError } from "@domain/errors/DomainError";

export class UserSuspendedError extends DomainError {
  constructor() {
    super("This account has been suspended by moderation", "USER_SUSPENDED");
  }
}
