import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { MessageRepository } from "@domain/message/repositories/message.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { ConversationOutput } from "./dto/get-conversation.dto";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { ConversationOutputMapper } from "./mapper/conversation.mapper";
import { inject, injectable } from "tsyringe";

interface GetConversationRequest {
    publicUserId: string;
    publicConversationId: string;
    page?: number;
    limit?: number;
}

@injectable()
export class GetConversationUseCase {
    constructor(
        @inject("ConversationRepository")
        private readonly conversationRepository: ConversationRepository,
        @inject("MessageRepository")
        private readonly messageRepository: MessageRepository,
        @inject("UserRepository")
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