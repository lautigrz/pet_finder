import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { CreateContentReportUseCase } from "@application/usecase/content-report-usecase/create-content-report.usecase";
import { GetContentReportQueueUseCase } from "@application/usecase/content-report-usecase/get-content-report-queue.usecase";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportQueueQuery, CreateContentReportInput } from "../schemas/content-report/content-report.schema";

@injectable()
export class ContentReportController {
    constructor(
        @inject("CreateContentReportUseCase")
        private createContentReportUseCase: CreateContentReportUseCase,
        @inject("GetContentReportQueueUseCase")
        private getContentReportQueueUseCase: GetContentReportQueueUseCase,
    ) { }

    create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const parsed = req.validated?.body as CreateContentReportInput;
        const reporterPublicId = req.auth?.sub;

        if (!reporterPublicId) {
            throw new UserNotFoundError();
        }

        const result = await this.createContentReportUseCase.execute(
            {
                targetType: parsed.targetType as ContentReportTargetType,
                targetPublicId: parsed.targetPublicId,
                reason: parsed.reason as ContentReportReason,
                description: parsed.description ?? null,
            },
            reporterPublicId,
        );

        logger.info("Content report created successfully", {
            targetType: parsed.targetType,
            autoFlagged: result.autoFlagged,
        });

        res.status(201).json({
            message: "Content report created successfully",
            publicId: result.publicId,
            autoFlagged: result.autoFlagged,
        });
    });

    getQueue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const query = req.validated?.query as ContentReportQueueQuery;
        const status = query?.status as ContentReportStatus | undefined;

        const result = await this.getContentReportQueueUseCase.execute(status);

        logger.info("Fetched content report queue successfully", {
            status: status ?? ContentReportStatus.PENDING,
            count: result.length,
        });

        res.status(200).json(result);
    });
}
