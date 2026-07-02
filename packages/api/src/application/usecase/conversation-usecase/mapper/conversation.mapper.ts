import { Conversation } from "@domain/conversation/Conversation";
import { ConversationOutput } from "../dto/get-conversation.dto";
import { User } from "@domain/entities/User";
import { Message } from "@domain/message/aggregate/MessageAgregate";

export class ConversationOutputMapper {

    static toOutput(
        conversation: Conversation,
        currentUser: User,
        otherUser: User,
        messages: Message[],
    ): ConversationOutput {
        return {
            publicId: conversation.publicId,
            createdAt: conversation.createdAt,
            isSuspended: conversation.isSuspended,
            otherUser: {
                publicId: otherUser.id!,
                username: otherUser.username,
                photoUrl: otherUser.photoUrl!,
            },
            messages: messages.map(m => ({
                publicId: m.publicId,
                text: m.text.getValue(),
                senderId: m.senderUserId === currentUser.internalId
                    ? currentUser.id!
                    : otherUser.id!,
                isRead: m.isRead,
                createdAt: m.createdAt,
                images: m.image?.map(img => ({
                    publicId: img.publicId,
                    url: img.url
                })) || []
            })),
        };
    }
}