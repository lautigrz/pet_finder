import { DomainError } from "./DomainError";

export class InvalidMessageTextError extends DomainError {
    constructor(reason = 'El texto del mensaje es inválido') {
        super(reason, 'INVALID_MESSAGE_TEXT');
    }
}