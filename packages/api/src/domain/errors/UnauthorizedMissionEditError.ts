import { DomainError } from "./DomainError";

export class UnauthorizedMissionEditError extends DomainError {
  constructor() {
    super("Only the report owner can edit or cancel this mission", "UNAUTHORIZED_MISSION_EDIT");
  }
}
