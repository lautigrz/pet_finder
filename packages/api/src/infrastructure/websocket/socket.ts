import { Server } from 'socket.io';
import type { Server as HttpServer } from "http"
import { readAuthConfig } from 'src/presentation/config/authConfig';
import { JwtTokenSigner } from 'src/infrastructure/security/JwtTokenSigner';
import { registerChatHandlers } from './handler/register-chat-handler';
import logger from '@infrastructure/logger/';

export let io: Server;

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

        registerChatHandlers(io, socket);

        socket.on("disconnect", () => {
            logger.info(`User disconnected from websocket`, { userPublicId, socketId: socket.id });
        })

    })

}