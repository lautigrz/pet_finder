import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository"
import type { MessageRepository } from "@domain/message/repositories/message.repository"
import type { IUserRepository } from "@domain/repositories/IUserRepository"
import type { ConversationSummaryOutput } from "./dto/get-my-conversartions"
import { UserNotFoundError } from "@domain/errors/UserNotFoundError"
import { inject, injectable } from "tsyringe"

@injectable()
export class ListMyConversationsUseCase {
    constructor(
        @inject("UserRepository")
        private userRepository: IUserRepository,
        @inject("ConversationRepository")
        private conversationRepository: ConversationRepository,
        @inject("MessageRepository")
        private messageRepository: MessageRepository
    ) { }

    async execute(publicUserId: string): Promise<ConversationSummaryOutput[]> {
        const user = await this.userRepository.findByPublicId(publicUserId);
        if (!user) throw new UserNotFoundError();

        const conversations = await this.conversationRepository.findAllByUserId(user.internalId!);

        const conversationsIds = conversations.map((conversation) => conversation.conversationId!);

        const lastMessages = await this.messageRepository.findLastMessageByConversationIds(conversationsIds);

        const usersIds = conversations.map((conversation) => conversation.getOtherParticipant(user.internalId!));

        const allUsers = await this.userRepository.findByIds(usersIds);

        const userMap = new Map(
            allUsers.map((user) => [user.user_id, user])
        )

        const lastMessageMap = new Map(
            lastMessages.map((message) => [message.conversationId!, message])
        )

        const results = conversations.map((conversation) => {
            const otherUserId = conversation.getOtherParticipant(user.internalId!);

            const otherUser = userMap.get(otherUserId);

            const otherUseData = otherUser ? {
                publicId: otherUser.public_id,
                username: otherUser.username,
                photoUrl: otherUser.photoUrl,
            } : {
                publicId: null,
                username: 'Usuario no encontrado',
                photoUrl: null,
            };

            const message = lastMessageMap.get(conversation.conversationId!);

            return {
                publicId: conversation.publicId,
                otherUser: {
                    publicId: otherUseData.publicId,
                    username: otherUseData.username,
                    photoUrl: otherUseData.photoUrl,
                },
                lastMessage: message
                    ? {
                        text: message.text.getValue(),
                        isRead: message.isRead,
                        createdAt: message.createdAt,
                    }
                    : null,
                createdAt: conversation.createdAt,
            };
        });

        return results;
    }
}
