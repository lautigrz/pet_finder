import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { createConversationSchema, getConversationSchema } from "@presentation/schemas/conversation/conversation.schema";
import { CreateConversationController } from "@presentation/controller/conversation/create-conversation.controller";
import { ListMyConversationsController } from "@presentation/controller/conversation/list-my-conversations.controller";
import { GetConversationController } from "@presentation/controller/conversation/get-conversation.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createConversation = container.resolve(CreateConversationController);
const listMyConversations = container.resolve(ListMyConversationsController);
const getConversation = container.resolve(GetConversationController);

router.post("/", requireAuth(tokenSigner), validateRequest(createConversationSchema), createConversation.handle);
router.get("/", requireAuth(tokenSigner), listMyConversations.handle);
router.get("/:publicConversationId", requireAuth(tokenSigner), validateRequest(getConversationSchema), getConversation.handle);

export default router;