
import { DomainError } from "./DomainError";

export class ConversationAlreadyExistsError extends DomainError {
    constructor() {
        super(`Conversation already exists`, "CONVERSATION_ALREADY_EXISTS");
    }

}