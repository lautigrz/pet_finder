import { Page, PaginationParams } from "@domain/shared/pagination/pagination";
import { Message } from "../aggregate/MessageAgregate";

export interface MessageRepository {

    findById(messageId: number): Promise<Message | null>;

    findByPublicId(publicId: string): Promise<Message | null>;

    findByConversationId(
        conversationId: number,
        options: PaginationParams & { orderBy?: 'asc' | 'desc' }
    ): Promise<Page<Message>>;

    findLastMessageByConversationIds(
        conversationIds: number[]
    ): Promise<Message[]>

    findUnreadByUserId(userId: number): Promise<Message[]>;

    countUnreadByConversationId(conversationId: number, userId: number): Promise<number>;

    save(message: Message): Promise<Message>;
    markAsRead(conversationId: number, userId: number): Promise<void>;

    delete(messageId: number): Promise<void>;
}