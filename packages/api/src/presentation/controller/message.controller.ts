import { SendMessageRequest } from "@application/usecase/message-usecase/dto/message.dto";
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { emitToUser } from "@infrastructure/websocket/socket";
import { asyncHandler } from "@presentation/handler/async-handler";
import { SendMessageInput } from "@presentation/schemas/message/message.schema";
import { Request, Response } from "express";
export class MessageController {

    constructor(
        private readonly sendMessageUseCase: SendMessageUseCase,
    ) { }

    uploadImage = asyncHandler(async (req: Request, res: Response) => {
        const message = req.validated as SendMessageInput;

        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        const userPublicId = req.auth?.sub;
        const images = files.map(file => Buffer.from(file.buffer));

        const data = {
            publicUserId: userPublicId,
            publicConversationId: message.body.conversationId,
            text: message.body.content,
            images
        }
        const result = await this.sendMessageUseCase.execute(data as SendMessageRequest);

        emitToUser(result.receiverId, "message:received", result);
        return res.status(200).json(result);
    })

}