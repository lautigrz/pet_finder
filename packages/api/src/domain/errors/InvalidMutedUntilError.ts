import { DomainError } from "./DomainError";

export class InvalidMutedUntilError extends DomainError {
    constructor() {
        super("mutedUntil must be a valid future ISO date or null", "INVALID_MUTED_UNTIL");
    }

}