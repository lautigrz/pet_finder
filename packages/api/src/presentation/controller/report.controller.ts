import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { CreateReportDTO } from "@application/usecase/report-usecase/dto/create-report.dto";
import { GetReportUseCase } from "@application/usecase/report-usecase/get-report-usecase";
import { Request, Response } from "express";
import { CreateReportInput } from "../schemas/report/create-report.schema";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { ReportType } from "@domain/report/types/report.type";
import { GetFilteredReportsDTO } from "../schemas/report/report-filter.schema";
import { ListUserReportsQuery } from "../schemas/report/list-user-reports.schema";
import { GetFilteredReportsUseCase } from "@application/usecase/report-usecase/get-filter-reports.usecase";
import { UpdateStatus } from "@application/usecase/report-usecase/update-status-report";
import { UpdateStatusDTO } from "@application/usecase/report-usecase/dto/update-status.dto";
import { UpdateReportUseCase } from "@application/usecase/report-usecase/update-report.usecase";
import { UpdateReportInput } from "../schemas/report/update-report.schema";
import { NotifyNearbyLostOwnersUseCase } from "@application/usecase/notify-nearby-lost-owners/notify-nearby-lost-owners.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from '@pet-alert/shared';
import { FollowReportUseCase } from "@application/usecase/report-usecase/follow-report.usecase";
import { UnfollowReportUseCase } from "@application/usecase/report-usecase/unfollow-report.usecase";
import { IsFollowingReportUseCase } from "@application/usecase/report-usecase/is-following-report.usecase";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateReportController {
    constructor(
        @inject("CreateReportUseCase")
        private useCase: CreateReportUseCase,
        @inject("GetReportUseCase")
        private getReportUseCase: GetReportUseCase,
        @inject("ListUserReportsUseCase")
        private listUserReportsUseCase: ListUserReportsUseCase,
        @inject("GetFilteredReportsUseCase")
        private filteresUseCase: GetFilteredReportsUseCase,
        @inject("UpdateStatusUseCase")
        private updateStatusUseCase: UpdateStatus,
        @inject("UpdateReportUseCase")
        private updateReportUseCase: UpdateReportUseCase,
        @inject("NotifyNearbyLostOwnersUseCase")
        private notifyNearbyLostOwnersUseCase: NotifyNearbyLostOwnersUseCase,
        @inject("FollowReportUseCase")
        private followReportUseCase: FollowReportUseCase,
        @inject("UnfollowReportUseCase")
        private unfollowReportUseCase: UnfollowReportUseCase,
        @inject("IsFollowingReportUseCase")
        private isFollowingReportUseCase: IsFollowingReportUseCase,
    ) { }

    create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const parsed = req.validated?.body as CreateReportInput;
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];

        const userPublicId = req.auth?.sub;

        if (!userPublicId) {
            throw new UserNotFoundError();
        }
        const dto = this.buildCreateDTO(parsed, files);
        const result = await this.useCase.execute(dto, userPublicId);
        logger.info("Report created successfully", { type: parsed.type });
        this.notifyNearbyOnSighting(parsed.type, result.publicId);
        res.status(201).json({ message: "Report created successfully", publicId: result.publicId });
    });

    list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const query = req.validated?.query as ListUserReportsQuery;

        const userId = req.auth!.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const pagination = { page: query.page, limit: query.limit };
        const filters = {
            reportType: query.reportType,
            animalType: query.animalType,
            lat: query.lat,
            lng: query.lng,
            radiusKm: query.radiusKm,
            createdFrom: query.createdFrom,
            createdTo: query.createdTo,
            q: query.q,
        };

        const result = await this.listUserReportsUseCase.execute(userId, pagination, filters);
        logger.info("Listed user reports successfully", {
            userId,
            page: pagination.page,
            limit: pagination.limit
        });
        res.status(200).json(result);

    });

    getFilteres = asyncHandler(async (req: Request, res: Response): Promise<void> => {

        const dto = req.validated?.query as GetFilteredReportsDTO;
        const reports = await this.filteresUseCase.execute(dto);

        logger.info("Filtered reports successfully", {
            query: dto,
            count: reports.length
        });
        res.status(200).json(reports);

    });


    getByPublicId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { publicId } = req.params;
        const report = await this.getReportUseCase.execute(publicId as string);
        logger.info("Fetched report successfully", { publicId });
        res.status(200).json(report);
    });

    private notifyNearbyOnSighting(type: string, sightingPublicId: string): void {
        if (type !== ReportType.SIGHTING) return;
        void this.notifyNearbyLostOwnersUseCase
            .execute(sightingPublicId)
            .catch((error) => logger.error("Failed to notify nearby lost owners", { error }));
    }

    private buildCreateDTO(parsed: CreateReportInput, files: Express.Multer.File[]): CreateReportDTO {
        if (parsed.type === ReportType.LOST) {
            return { ...parsed, images: files.map(f => f.buffer) } as CreateReportDTO;
        }
        return { ...parsed, images: files.map(f => f.buffer) } as CreateReportDTO;
    }

    updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const dto = req.validated?.body as UpdateStatusDTO;
        const publicId = req.validated?.params.publicId;

        if (!publicId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        dto.publicId = publicId;

        await this.updateStatusUseCase.execute(dto);

        logger.info("Updated report status successfully", {
            publicId,
            status: dto.status
        });

        res.sendStatus(204);

    });

    update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const body = req.validated?.body as UpdateReportInput;
        const publicId = req.validated?.params.publicId as string;
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        await this.updateReportUseCase.execute(
            {
                publicId,
                ...body,
                newImages: files.map(f => f.buffer),
            },
            userPublicId,
        );
        logger.info('Report updated successfully', { publicId });
        res.sendStatus(204);

    });

    follow = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        const reportPublicId = req.params.publicId;

        if (typeof userPublicId !== "string") {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (typeof reportPublicId !== "string") {
            res.status(400).json({ error: "Report publicId is required" });
            return;
        }

        await this.followReportUseCase.execute({
            userPublicId,
            reportPublicId,
        });

        logger.info("User followed report successfully", {
            userPublicId,
            reportPublicId,
        });

        res.sendStatus(204);
    });

    unfollow = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        const reportPublicId = req.params.publicId;

        if (typeof userPublicId !== "string") {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (typeof reportPublicId !== "string") {
            res.status(400).json({ error: "Report publicId is required" });
            return;
        }

        await this.unfollowReportUseCase.execute({
            userPublicId,
            reportPublicId,
        });

        logger.info("User unfollowed report successfully", {
            userPublicId,
            reportPublicId,
        });

        res.sendStatus(204);
    });

    isFollowing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        const reportPublicId = req.params.publicId;

        if (typeof userPublicId !== "string") {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (typeof reportPublicId !== "string") {
            res.status(400).json({ error: "Report publicId is required" });
            return;
        }

        const result = await this.isFollowingReportUseCase.execute({
            userPublicId,
            reportPublicId,
        });

        res.status(200).json(result);
    });
}