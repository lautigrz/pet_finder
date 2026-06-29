import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { MessageRepository } from "@domain/message/repositories/message.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MessageOutput, SendMessageRequest } from "./dto/message.dto";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { MessageText } from "@domain/message/value-objects/message.vo";
import { Message } from "@domain/message/aggregate/MessageAgregate";
import { randomUUID } from "crypto";
import type { StorageService } from "@application/ports/StorageService";
import { MessageImage } from "@domain/message/value-objects/image.vo";
import { inject, injectable } from "tsyringe";

@injectable()
export class SendMessageUseCase {

    constructor(
        @inject("ConversationRepository")
        private readonly conversationRepository: ConversationRepository,
        @inject("MessageRepository")
        private readonly messageRepository: MessageRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("StorageService")
        private readonly storageService: StorageService
    ) { }


    async execute(request: SendMessageRequest): Promise<MessageOutput> {

        const user = await this.userRepository.findByPublicId(request.publicUserId);
        if (!user) throw new UserNotFoundError();

        const conversation = await this.conversationRepository.findByPublicId(request.publicConversationId);
        if (!conversation) throw new ConversationNotFoundError(request.publicConversationId);

        if (!conversation.hasParticipant(user.internalId!)) throw new UnauthorizedConversationError();

        const otherUserId = conversation.getOtherParticipant(user.internalId!);
        const receiver = await this.userRepository.findById(otherUserId);
        if (!receiver) throw new UserNotFoundError();

        const messageText = MessageText.create(request.text ?? '', request.images && request.images.length > 0);

        const images = (request.images
            ? await Promise.all(
                request.images.map(image =>
                    this.storageService.upload(image, "messages")
                )
            )
            : []
        ).map(result =>
            MessageImage.create({
                imageId: null,
                publicId: crypto.randomUUID(),
                url: result.url,
            })
        );
        const message = Message.create({
            publicId: randomUUID(),
            text: messageText,
            conversationId: conversation.conversationId!,
            senderUserId: user.internalId!,
            receiverId: receiver.internalId!,
            isRead: false,
            createdAt: new Date(),
            images
        })

        const saved = await this.messageRepository.save(message);

        return {
            publicId: saved.publicId,
             conversationId: request.publicConversationId,
            text: saved.text.getValue(),
            senderId: user.id,
            receiverId: receiver.id,
            isRead: saved.isRead,
            createdAt: saved.createdAt,
            images: saved.image.map(image => ({
                url: image.url,
                publicId: image.publicId,
            })) || []
        }

    }
}