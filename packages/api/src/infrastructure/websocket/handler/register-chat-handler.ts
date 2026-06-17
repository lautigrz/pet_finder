import { Server, Socket } from "socket.io";
import prisma from "@infrastructure/prisma/prisma.client";
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { PrismaConversationRepository } from "@infrastructure/repository/conversation/conversation.repository";
import { PrismaMessageRepository } from "@infrastructure/repository/message/message.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { DomainError } from "@domain/errors/DomainError";
import logger from "@infrastructure/logger/";
import { ReadMessageUseCase } from "@application/usecase/message-usecase/read-message.usecase";

const conversationRepository = new PrismaConversationRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const userRepository = new PrismaUserRepository();

export function registerChatHandlers(io: Server, socket: Socket) {

    const sendMessageUseCase = new SendMessageUseCase(
        conversationRepository,
        messageRepository,
        userRepository
    );

    const readMessageUseCase = new ReadMessageUseCase(
        conversationRepository,
        messageRepository,
        userRepository
    )

    socket.on('message:send', async (data: { conversationId: string, text: string }) => {
        try {
            const message = await sendMessageUseCase.execute({
                publicUserId: socket.data.user,
                publicConversationId: data.conversationId,
                text: data.text
            })

            socket.emit('message:sent', message);
            io.to(`user:${message.receiverId}`).emit('message:received', message)
        } catch (error) {
            logger.error('Error in message:send event', { error });

            if (error instanceof DomainError) {
                socket.emit('message:error', {
                    code: error.code,
                    message: error.message
                });
            } else {
                socket.emit('message:error', {
                    code: 'INTERNAL_ERROR',
                    message: 'Error al enviar el mensaje'
                });
            }
        }
    })

    socket.on('message:read', async (data: { conversationId: string }) => {
        try {

            logger.info('message:read event', { data, user: socket.data.user });

            const otherParticipantPublicId = await readMessageUseCase.execute(
                data.conversationId,
                socket.data.user
            )

            if (otherParticipantPublicId) {
                io.to(`user:${otherParticipantPublicId}`).emit('message:read', { conversationId: data.conversationId });
            }

        } catch (error) {
            logger.error('Error in message:read event', { error });

            if (error instanceof DomainError) {
                socket.emit('message:error', {
                    code: error.code,
                    message: error.message
                });
            } else {
                socket.emit('message:error', {
                    code: 'INTERNAL_ERROR',
                    message: 'Error al leer el mensaje'
                });
            }
        }
    })

}
