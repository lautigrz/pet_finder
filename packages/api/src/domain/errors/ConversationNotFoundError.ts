import { DomainError } from "./DomainError";

export class ConversationNotFoundError extends DomainError {
    constructor(publicId: string) {
        super(`Conversation not found with publicId: ${publicId}`, "CONVERSATION_NOT_FOUND");
    }

}
