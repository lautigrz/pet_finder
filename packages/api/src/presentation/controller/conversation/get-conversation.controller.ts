import { Request, Response } from "express";
import { GetConversationUseCase } from "@application/usecase/conversation-usecase/get-conversation.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetConversationController {
  constructor(
    @inject("GetConversationUseCase")
    private readonly getConversationUseCase: GetConversationUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const publicUserId = req.auth!.sub;
    const publicConversationId = req.validated?.params?.publicConversationId;
    const query = req.validated?.query as { page?: number; limit?: number } | undefined;

    const conversation = await this.getConversationUseCase.execute({
      publicUserId,
      publicConversationId: publicConversationId!,
      page: query?.page,
      limit: query?.limit,
    });

    res.status(200).json(conversation);
  });
}
