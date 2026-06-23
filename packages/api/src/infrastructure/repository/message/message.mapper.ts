import { Message } from "@domain/message/aggregate/MessageAgregate";
import { MessageImage } from "@domain/message/value-objects/image.vo";
import { MessageText } from "@domain/message/value-objects/message.vo";
interface PrismaMessageImage {
    image_id: number;
    public_id: string;
    photoUrl: string;
    message_id: number;
    created_at: Date;
}

interface PrismaMessage {
    message_id: number;
    public_id: string;
    sender_user_id: number;
    receiver_user_id: number;
    conversation_id: number;
    message_text: string;
    is_read: boolean;
    created_at: Date;
    images?: PrismaMessageImage[];
}
export class MessageMapper {
    static toDomain(raw: PrismaMessage): Message {
        return Message.create({
            messageId: raw.message_id,
            publicId: raw.public_id,
            receiverId: raw.receiver_user_id,
            senderUserId: raw.sender_user_id,
            conversationId: raw.conversation_id,
            text: MessageText.create(raw.message_text, true),
            isRead: raw.is_read,
            createdAt: raw.created_at,
            images: raw.images?.map(image =>
                MessageImage.create({
                    imageId: image.image_id,
                    publicId: image.public_id,
                    url: image.photoUrl
                })
            ) ?? []
        });
    }

    static toPersistence(message: Message): Omit<PrismaMessage, 'message_id'> {
        return {
            public_id: message.publicId,
            sender_user_id: message.senderUserId,
            receiver_user_id: message.receiverUserId,
            conversation_id: message.conversationId,
            message_text: message.text.getValue(),
            is_read: message.isRead,
            created_at: message.createdAt,
        };
    }
}