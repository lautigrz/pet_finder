import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaConversationRepository } from "@infrastructure/repository/conversation/conversation.repository";
import { PrismaMessageRepository } from "@infrastructure/repository/message/message.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { ClaudinaryService } from "@infrastructure/storage/CloudinaryService";
import { readAuthConfig } from "@presentation/config/authConfig";
import { MessageController } from "@presentation/controller/message.controller";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { sendMessageSchema } from "@presentation/schemas/message/message.schema";
import { Router } from "express";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const conversationRepository = new PrismaConversationRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const userRepository = new PrismaUserRepository();
const cloudinaryService = new ClaudinaryService();

const sendMessageUseCase = new SendMessageUseCase(conversationRepository, messageRepository, userRepository, cloudinaryService);

const messageController = new MessageController(sendMessageUseCase);

router.post('/', requireAuth(tokenSigner), upload.array('photos', 10), validateRequest(sendMessageSchema), messageController.uploadImage)

export const messageRouter = router;
