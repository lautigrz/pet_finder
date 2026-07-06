import { Request, Response } from "express";
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { SendMessageRequest } from "@application/usecase/message-usecase/dto/message.dto";
import { emitToUser } from "@infrastructure/websocket/socket";
import { asyncHandler } from "@presentation/handler/async-handler";
import { SendMessageInput } from "@presentation/schemas/message/message.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class SendMessageController {
  constructor(
    @inject("SendMessageUseCase")
    private readonly sendMessageUseCase: SendMessageUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const message = req.validated as SendMessageInput;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const userPublicId = req.auth?.sub;
    const images = files.map((file) => Buffer.from(file.buffer));

    const data: SendMessageRequest = {
      publicUserId: userPublicId!,
      publicConversationId: message.body.conversationId!,
      text: message.body.content!,
      images,
    };

    const result = await this.sendMessageUseCase.execute(data);
    emitToUser(result.receiverId, "message:received", result);
    res.status(200).json(result);
  });
}
