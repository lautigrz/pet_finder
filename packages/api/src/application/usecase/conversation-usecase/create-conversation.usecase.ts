import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { CreateConversationOutput, CreateConversationRequest } from "./dto/create-conversation.dto";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationAlreadyExistsError } from "@domain/errors/ConversationAlreadyExistsError";
import { Conversation } from "@domain/conversation/Conversation";
import { randomUUID } from "crypto";

export class CreateConversationUseCase {
    constructor(
        private readonly conversationRepository: ConversationRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(request: CreateConversationRequest): Promise<CreateConversationOutput> {
        const user = await this.userRepository.findByPublicId(request.publicRequesterId);
        if (!user) throw new UserNotFoundError();

        const target = await this.userRepository.findByPublicId(request.publicTargetId);
        if (!target) throw new UserNotFoundError();

        if (user.internalId === target.internalId) throw new Error("User cannot create a conversation with itself");

        const conversation = await this.conversationRepository.findByParticipants(
            user.internalId!,
            target.internalId!,
        );
        if (conversation) throw new ConversationAlreadyExistsError();

        const newConversation = Conversation.create({
            publicId: randomUUID(),
            userOneId: user.internalId!,
            userTwoId: target.internalId!,
            createdAt: new Date(),
        })

        await this.conversationRepository.save(newConversation);

        return {
            publicId: newConversation.publicId,
            createdAt: newConversation.createdAt,
        }
    }

}