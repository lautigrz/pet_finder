import { Request, Response } from "express";
import { CreateConversationUseCase } from "@application/usecase/conversation-usecase/create-conversation.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateConversationController {
  constructor(
    @inject("CreateConversationUseCase")
    private readonly createConversationUseCase: CreateConversationUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicUserId = req.auth!.sub;
    const { publicTargetId } = req.validated?.body as { publicTargetId: string };

    const conversation = await this.createConversationUseCase.execute({
      publicRequesterId: publicUserId,
      publicTargetId,
    });

    res.status(201).json(conversation);
  });
}
