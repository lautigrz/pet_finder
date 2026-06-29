import { DomainError } from "./DomainError";

export class MatchResultNotFoundError extends DomainError {
  constructor(publicId: string) {
    super(`Match result not found with publicId: ${publicId}`, "MATCH_RESULT_NOT_FOUND");
  }
}
