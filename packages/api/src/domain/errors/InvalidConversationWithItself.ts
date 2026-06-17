import { DomainError } from "./DomainError";

export class InvalidConversationWithItself extends DomainError {
    constructor(publicIdOne: string, publicIdTwo: string) {
        super(`La conversación entre ${publicIdOne} y ${publicIdTwo} no puede ser consigo mismo`, 'INVALID_CONVERSATION_WITH_ITSELF');
    }
}