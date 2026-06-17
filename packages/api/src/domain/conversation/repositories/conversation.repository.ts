import { Conversation } from "../Conversation";

export interface ConversationRepository {


    findAllByUserId(userId: number): Promise<Conversation[]>;

    findByPublicId(publicId: string): Promise<Conversation | null>;

    findByParticipants(userOneId: number, userTwoId: number): Promise<Conversation | null>;

    findById(conversationId: number): Promise<Conversation | null>;

    save(conversation: Conversation): Promise<Conversation>;

    delete(conversationId: number): Promise<void>;
}