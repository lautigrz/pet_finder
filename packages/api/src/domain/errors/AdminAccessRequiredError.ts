import { DomainError } from "./DomainError";

export class AdminAccessRequiredError extends DomainError {
  constructor() {
    super("Admin access required", "ADMIN_ACCESS_REQUIRED");
  }
}
