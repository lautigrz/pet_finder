import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { MessageRepository } from "@domain/message/repositories/message.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { ConversationOutput } from "./dto/get-conversation.dto";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { ConversationOutputMapper } from "./mapper/conversation.mapper";

interface GetConversationRequest {
    publicUserId: string;
    publicConversationId: string;
    page?: number;
    limit?: number;
}

export class GetConversationUseCase {
    constructor(
        private readonly conversationRepository: ConversationRepository,
        private readonly messageRepository: MessageRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(request: GetConversationRequest): Promise<ConversationOutput> {
        const user = await this.userRepository.findByPublicId(request.publicUserId);
        if (!user) throw new UserNotFoundError();

        const conversation = await this.conversationRepository.findByPublicId(request.publicConversationId);
        if (!conversation) throw new ConversationNotFoundError(request.publicConversationId);

        if (!conversation.hasParticipant(user.internalId!)) throw new UnauthorizedConversationError();

        const otherUserId = conversation.getOtherParticipant(user.internalId!);
        const otherUser = await this.userRepository.findById(otherUserId);
        if (!otherUser) throw new UserNotFoundError();

        const messages = await this.messageRepository.findByConversationId(
            conversation.conversationId!,
            { page: request.page ?? 1, limit: request.limit ?? 20, orderBy: 'desc' }
        );
        return ConversationOutputMapper.toOutput(conversation, user, otherUser, messages.items.reverse());
    }
}