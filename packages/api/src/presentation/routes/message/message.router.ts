import { Router } from "express";
import { container } from "tsyringe";
import { MessageController } from "@presentation/controller/message.controller";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { sendMessageSchema } from "@presentation/schemas/message/message.schema";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const messageController = container.resolve(MessageController);

router.post('/', requireAuth(tokenSigner), upload.array('photos', 10), validateRequest(sendMessageSchema), messageController.uploadImage)

export const messageRouter = router;
