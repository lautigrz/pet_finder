import { DomainError } from "./DomainError";

export class PetNotFoundError extends DomainError {
  constructor(petId: number | string) {
    super(`Pet not found with ID: ${petId}`, "PET_NOT_FOUND");
  }
}
