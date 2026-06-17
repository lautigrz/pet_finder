import { Conversation } from "@domain/conversation/Conversation";
import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { PrismaClient } from "@prisma/client";
import { ConversationMapper } from "./conversation.mapper";

export class PrismaConversationRepository implements ConversationRepository {

    constructor(private readonly prisma: PrismaClient) { }

    async findAllByUserId(userId: number): Promise<Conversation[]> {

        const result = await this.prisma.conversation.findMany({
            where: {
                OR: [
                    { user_one_id: userId },
                    { user_two_id: userId },
                ]
            },
            orderBy: {
                created_at: 'desc',
            }
        })
        return result.map(ConversationMapper.toDomain);
    }
    async findByPublicId(publicId: string): Promise<Conversation | null> {
        const result = await this.prisma.conversation.findUnique({ where: { public_id: publicId } })
        if (!result) return null;

        return ConversationMapper.toDomain(result);
    }
    async findByParticipants(userOneId: number, userTwoId: number): Promise<Conversation | null> {
        const result = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { user_one_id: userOneId, user_two_id: userTwoId },
                    { user_one_id: userTwoId, user_two_id: userOneId }
                ]
            }
        })
        if (!result) return null;
        return ConversationMapper.toDomain(result);
    }
    async findById(conversationId: number): Promise<Conversation | null> {
        const result = await this.prisma.conversation.findUnique({ where: { conversation_id: conversationId } })
        if (!result) return null;
        return ConversationMapper.toDomain(result);
    }
    async save(conversation: Conversation): Promise<Conversation> {

        const result = ConversationMapper.toPersistence(conversation);

        const createConversation = await this.prisma.conversation.create({ data: result });

        return ConversationMapper.toDomain(createConversation);
    }
    async delete(conversationId: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

}