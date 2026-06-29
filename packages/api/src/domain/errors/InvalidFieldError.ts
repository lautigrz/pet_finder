import { DomainError } from "./DomainError";

export class InvalidFieldError extends DomainError {
    constructor(public readonly field: string, message: string) {
        super(`Invalid field "${field}": ${message}`, "INVALID_FIELD");
    }
}
