import { DomainError } from "./DomainError";

export class InvalidAnimalTypeError extends DomainError {
    constructor(message: string) {
        super(message, "INVALID_ANIMAL_TYPE");
    }
}
