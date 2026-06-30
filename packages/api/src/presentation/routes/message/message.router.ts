import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { sendMessageSchema } from "@presentation/schemas/message/message.schema";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { SendMessageController } from "@presentation/controller/message/send-message.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const sendMessage = container.resolve(SendMessageController);

router.post("/", requireAuth(tokenSigner), upload.array("photos", 10), validateRequest(sendMessageSchema), sendMessage.handle);

export const messageRouter = router;
