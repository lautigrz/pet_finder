import { Router } from "express";
import { ConversationController } from "@presentation/controller/conversation.controller";
import { PrismaConversationRepository } from "@infrastructure/repository/conversation/conversation.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import prisma from "@infrastructure/prisma/prisma.client";
import { CreateConversationUseCase } from "@application/usecase/conversation-usecase/create-conversation.usecase";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { createConversationSchema, getConversationSchema } from "@presentation/schemas/conversation/conversation.schema";
import { readAuthConfig } from "@presentation/config/authConfig";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { ListMyConversationsUseCase } from "@application/usecase/conversation-usecase/list-my-conversations.usecase";
import { PrismaMessageRepository } from "@infrastructure/repository/message/message.repository";
import { GetConversationUseCase } from "@application/usecase/conversation-usecase/get-conversation.usecase";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const conversationRepository = new PrismaConversationRepository(prisma);
const userRepository = new PrismaUserRepository();
const messageRepository = new PrismaMessageRepository(prisma);

const createConversationUseCase = new CreateConversationUseCase(conversationRepository, userRepository);
const listMyConversationsUseCase = new ListMyConversationsUseCase(userRepository, conversationRepository, messageRepository);
const getConversationUseCase = new GetConversationUseCase(conversationRepository, messageRepository, userRepository);
const conversationController = new ConversationController(createConversationUseCase, listMyConversationsUseCase, getConversationUseCase);

router.post('/', requireAuth(tokenSigner), validateRequest(createConversationSchema), conversationController.create);
router.get('/', requireAuth(tokenSigner), conversationController.getMyConversations);
router.get('/:publicConversationId', requireAuth(tokenSigner), validateRequest(getConversationSchema), conversationController.getConversation);

export default router;