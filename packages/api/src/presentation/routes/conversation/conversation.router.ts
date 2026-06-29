import { Router } from "express";
import { container } from "tsyringe";
import { ConversationController } from "@presentation/controller/conversation.controller";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { createConversationSchema, getConversationSchema } from "@presentation/schemas/conversation/conversation.schema";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const conversationController = container.resolve(ConversationController);

router.post('/', requireAuth(tokenSigner), validateRequest(createConversationSchema), conversationController.create);
router.get('/', requireAuth(tokenSigner), conversationController.getMyConversations);
router.get('/:publicConversationId', requireAuth(tokenSigner), validateRequest(getConversationSchema), conversationController.getConversation);

export default router;