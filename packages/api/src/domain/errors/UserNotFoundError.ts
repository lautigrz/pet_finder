import { DomainError } from "./DomainError";

export class UserNotFoundError extends DomainError {
  constructor() {
    super("User not found", "USER_NOT_FOUND");
  }
}