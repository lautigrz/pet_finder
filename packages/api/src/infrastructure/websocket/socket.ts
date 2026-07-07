import { Server } from 'socket.io';
import type { Server as HttpServer } from "http"
import { readAuthConfig } from 'src/presentation/config/authConfig';
import { JwtTokenSigner } from 'src/infrastructure/security/JwtTokenSigner';
import { registerChatHandlers } from './handler/register-chat-handler';
import { logger } from '@pet-alert/shared';

export let io: Server;

const onlineUsers = new Map<string, number>();

function isOnline(userPublicId: string): boolean {
    return (onlineUsers.get(userPublicId) ?? 0) > 0;
}

export function initSocket(httpServer: HttpServer) {
    const { jwtSecret, accessTtl } = readAuthConfig();
    const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);

    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        },
    })

    io.use((socket, next) => {
        const authHeader = socket.handshake.headers.authorization;

        if (!authHeader) {
            return next(new Error("Authentication error: No token provided"))
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            return next(new Error("Authentication error: Invalid token"))
        }

        try {
            const payload = tokenSigner.verify(token);

            if (typeof payload.sub !== 'string') {
                return next(new Error("Authentication error: Invalid token"))
            }

            socket.data.user = payload.sub;
            next();
        } catch (error) {
            next(new Error("Authentication error: Invalid token"));
        }

    })

    io.on('connection', (socket) => {
        const userPublicId = socket.data.user;
        logger.info(`User connected to websocket`, { userPublicId, socketId: socket.id });
        socket.join(`user:${userPublicId}`);

        const previousConnections = onlineUsers.get(userPublicId) ?? 0;
        onlineUsers.set(userPublicId, previousConnections + 1);
        if (previousConnections === 0) {
            io.emit('presence:changed', { userPublicId, online: true });
        }

        registerChatHandlers(io, socket);

        socket.on('presence:get', (data: { userPublicId: string }) => {
            socket.emit('presence:status', {
                userPublicId: data.userPublicId,
                online: isOnline(data.userPublicId),
            });
        });

        socket.on("disconnect", () => {
            logger.info(`User disconnected from websocket`, { userPublicId, socketId: socket.id });

            const remaining = (onlineUsers.get(userPublicId) ?? 1) - 1;
            if (remaining <= 0) {
                onlineUsers.delete(userPublicId);
                io.emit('presence:changed', { userPublicId, online: false });
            } else {
                onlineUsers.set(userPublicId, remaining);
            }
        })

    })

}

export function emitToUser(userPublicId: string, event: string, payload: unknown): void {
    io.to(`user:${userPublicId}`).emit(event, payload);
}