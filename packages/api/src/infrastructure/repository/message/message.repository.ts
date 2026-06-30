import { MessageRepository } from "@domain/message/repositories/message.repository";
import { Message } from "@domain/message/aggregate/MessageAgregate";
import { Page, PaginationParams } from "@domain/shared/pagination/pagination";
import { PrismaClient } from "@prisma/client";
import { MessageMapper } from "./message.mapper";
import { inject, injectable } from "tsyringe";


@injectable()
export class PrismaMessageRepository implements MessageRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async findLastMessageByConversationIds(conversationIds: number[]): Promise<Message[]> {
        if (conversationIds.length === 0) return [];

        const messages = await this.prisma.$queryRaw<Array<{
            message_id: number;
            public_id: string;
            sender_user_id: number;
            receiver_user_id: number;
            conversation_id: number;
            message_text: string;
            is_read: boolean;
            created_at: Date;
        }>>`
            SELECT DISTINCT ON (conversation_id)
                message_id, public_id, sender_user_id, receiver_user_id,
                conversation_id, message_text, is_read, created_at
            FROM messages
            WHERE conversation_id = ANY(${conversationIds})
            ORDER BY conversation_id, created_at DESC
        `;

        return messages.map(MessageMapper.toDomain);
    }

    async findById(messageId: number): Promise<Message | null> {

        const result = await this.prisma.message.findUnique({ where: { message_id: messageId } });

        if (!result) {
            return null;
        }
        return MessageMapper.toDomain(result);
    }
    async findByPublicId(publicId: string): Promise<Message | null> {

        const result = await this.prisma.message.findUnique({ where: { public_id: publicId } });

        if (!result) {
            return null;
        }

        return MessageMapper.toDomain(result);
    }
    async findByConversationId(conversationId: number, options: PaginationParams & { orderBy?: 'asc' | 'desc' }): Promise<Page<Message>> {

        const { page, limit } = options;
        const skip = (page - 1) * limit;

        const [message, total] = await this.prisma.$transaction([
            this.prisma.message.findMany({
                where: { conversation_id: conversationId },
                skip,
                take: limit,
                orderBy: { created_at: options.orderBy ?? 'asc' },
                include: {
                    images: true
                }
            }
            ),
            this.prisma.message.count({ where: { conversation_id: conversationId } })
        ])

        return {
            items: message.map(MessageMapper.toDomain),
            total
        }
    }


    async findUnreadByUserId(userId: number): Promise<Message[]> {

        const messages = await this.prisma.message.findMany({
            where: {
                receiver_user_id: userId,
                is_read: false
            },
            include: {
                images: true
            }
        });

        return messages.map(MessageMapper.toDomain);
    }
    async countUnreadByConversationId(
        conversationId: number,
        userId: number
    ): Promise<number> {

        return this.prisma.message.count({
            where: {
                conversation_id: conversationId,
                receiver_user_id: userId,
                is_read: false
            }
        });

    }

    async save(message: Message): Promise<Message> {

        const result = MessageMapper.toPersistence(message);

        const saveMessage = await this.prisma.message.create({
            data: {
                ...result,
                images: {
                    create: message.image.map((image) => ({
                        public_id: image.publicId,
                        photoUrl: image.url
                    }))
                }
            },
            include: {
                images: true
            }
        });

        return MessageMapper.toDomain(saveMessage);
    }
    async markAsRead(conversationId: number, userId: number): Promise<void> {

        await this.prisma.message.updateMany({
            where: {
                conversation_id: conversationId,
                receiver_user_id: userId
            },
            data: {
                is_read: true
            }
        });
    }
    async delete(messageId: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}