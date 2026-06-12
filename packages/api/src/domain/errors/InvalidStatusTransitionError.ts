import { DomainError } from "./DomainError";

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition from "${from}" to "${to}"`, "INVALID_STATUS_TRANSITION");
  }
}
