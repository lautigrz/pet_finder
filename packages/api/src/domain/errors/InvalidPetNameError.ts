import { DomainError } from "./DomainError";

export class InvalidPetNameError extends DomainError {
  constructor(message: string = "Name must be at least 2 characters long") {
    super(message, "INVALID_PET_NAME");
  }
}
