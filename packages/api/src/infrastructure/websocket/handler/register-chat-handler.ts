import { Server, Socket } from "socket.io";
import { container } from "tsyringe";
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { DomainError } from "@domain/errors/DomainError";
import { logger } from '@pet-alert/shared';
import { ReadMessageUseCase } from "@application/usecase/message-usecase/read-message.usecase";

export function registerChatHandlers(io: Server, socket: Socket) {

    const sendMessageUseCase = container.resolve(SendMessageUseCase);
    const readMessageUseCase = container.resolve(ReadMessageUseCase);

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
