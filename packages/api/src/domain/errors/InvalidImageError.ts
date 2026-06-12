import { DomainError } from "./DomainError";

export class InvalidImageError extends DomainError {
    constructor(message: string) {
        super(message, "INVALID_IMAGE");
    }
}