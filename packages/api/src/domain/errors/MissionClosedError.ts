import { DomainError } from "./DomainError";

export class MissionClosedError extends DomainError {
  constructor(action: string) {
    super(`Cannot ${action} a closed mission`, "MISSION_CLOSED");
  }
}
