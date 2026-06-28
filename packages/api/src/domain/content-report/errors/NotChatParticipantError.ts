import { DomainError } from "@domain/errors/DomainError";

export class NotChatParticipantError extends DomainError {
  constructor() {
    super("You can only report a chat you are part of", "NOT_CHAT_PARTICIPANT");
  }
}
