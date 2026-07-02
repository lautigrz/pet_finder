import { Conversation } from "@domain/conversation/Conversation";

interface PrismaConversation {
    conversation_id: number;
    public_id: string;
    user_one_id: number;
    user_two_id: number;
    created_at: Date;
    is_suspended: boolean;
}

export class ConversationMapper {

    static toDomain(raw: PrismaConversation): Conversation {
        return Conversation.create({
            conversationId: raw.conversation_id,
            publicId: raw.public_id,
            userOneId: raw.user_one_id,
            userTwoId: raw.user_two_id,
            createdAt: raw.created_at,
            isSuspended: raw.is_suspended,
        })
    }

    static toPersistence(raw: Conversation): Omit<PrismaConversation, 'conversation_id'> {
        return {
            public_id: raw.publicId,
            user_one_id: raw.userOneId,
            user_two_id: raw.userTwoId,
            created_at: raw.createdAt,
            is_suspended: raw.isSuspended,
        }
    }

}