import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { MessageRepository } from "@domain/message/repositories/message.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";

export class ReadMessageUseCase {

    constructor(
        private conversationRepository: ConversationRepository,
        private messageRepository: MessageRepository,
        private userRepository: IUserRepository,
    ) { }

    async execute(publicIdConversation: string, publicUserId: string): Promise<string | null> {

        const conversation = await this.conversationRepository.findByPublicId(publicIdConversation);

        if (!conversation || !conversation.conversationId) {
            throw new ConversationNotFoundError(publicIdConversation);
        }

        const user = await this.userRepository.findByPublicId(publicUserId);

        if (!user || !user.internalId) {
            throw new UserNotFoundError();
        }

        if (!conversation.hasParticipant(user.internalId)) {
            throw new UnauthorizedConversationError();
        }

        await this.messageRepository.markAsRead(conversation.conversationId, user.internalId);

        const userId = conversation.getOtherParticipant(user.internalId);
        const otherUser = await this.userRepository.findById(userId!);


        return otherUser?.id ?? null;
    }

}