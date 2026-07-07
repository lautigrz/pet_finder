import { DomainError } from "./DomainError";

export class MissionNotFoundError extends DomainError {
  constructor(publicId: string) {
    super(`Mission not found with publicId: ${publicId}`, "MISSION_NOT_FOUND");
  }
}
