import { DomainError } from "./DomainError";

export class UnauthorizedConversationError extends DomainError {
    constructor() {
        super("Unauthorized to access conversation", "UNAUTHORIZED_CONVERSATION");
    }
}