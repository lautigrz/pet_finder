import { Request, Response } from "express";
import { CreateConversationUseCase } from "@application/usecase/conversation-usecase/create-conversation.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ListMyConversationsUseCase } from "@application/usecase/conversation-usecase/list-my-conversations.usecase";
import { GetConversationUseCase } from "@application/usecase/conversation-usecase/get-conversation.usecase";

export class ConversationController {

    constructor(
        private createConversationUseCase: CreateConversationUseCase,
        private listMyConversationsUseCase: ListMyConversationsUseCase,
        private getConversationUseCase: GetConversationUseCase
    ) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const publicUserId = req.auth?.sub
        const { publicTargetId } = req.validated?.body as { publicTargetId: string };

        const conversation = await this.createConversationUseCase.execute({
            publicRequesterId: publicUserId!,
            publicTargetId: publicTargetId
        });

        res.status(201).json(conversation);

    });


    getMyConversations = asyncHandler(async (req: Request, res: Response) => {
        const publicUserId = req.auth?.sub
        const conversations = await this.listMyConversationsUseCase.execute(publicUserId!);
        res.status(200).json(conversations);
    });

    getConversation = asyncHandler(async (req: Request, res: Response) => {
        const publicUserId = req.auth?.sub
        const publicConversationId = req.validated?.params?.publicConversationId
        const query = req.validated?.query as { page?: number; limit?: number } | undefined;

        const conversation = await this.getConversationUseCase.execute({
            publicUserId: publicUserId!,
            publicConversationId: publicConversationId!,
            page: query?.page,
            limit: query?.limit,
        });


        res.status(200).json(conversation);
    });





}