import { Request, Response } from "express";
import { ListMyConversationsUseCase } from "@application/usecase/conversation-usecase/list-my-conversations.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class ListMyConversationsController {
  constructor(
    @inject("ListConversationUseCase")
    private readonly listMyConversationsUseCase: ListMyConversationsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicUserId = req.auth!.sub;
    const conversations = await this.listMyConversationsUseCase.execute(publicUserId);
    res.status(200).json(conversations);
  });
}
