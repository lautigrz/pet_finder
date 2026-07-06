import { DomainError } from "@domain/errors/DomainError";

export class ConversationSuspendedError extends DomainError {
  constructor() {
    super("This conversation has been suspended by moderation", "CONVERSATION_SUSPENDED");
  }
}
