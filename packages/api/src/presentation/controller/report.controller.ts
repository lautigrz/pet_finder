import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { CreateReportDTO } from "@application/usecase/report/dto/create-report.dto";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { Request, Response } from "express";
import { CreateReportInput } from "../schemas/report/create-report.schema";
import { ValidationError } from "../errors/ValidationError";
import { PaginationParams } from "@domain/shared/pagination/pagination";
import { ListUserReportsUseCase } from "@application/usecase/report/list-user-reports.usecase";
import { ReportType } from "@domain/report/types/report.type";
import { GetFilteredReportsDTO } from "../schemas/report/report-filter.schema";
import { GetFilteredReportsUseCase } from "@application/usecase/report/get-filter-reports.usecase";
import { UpdateStatus } from "@application/usecase/report/update-status-report";
import { UpdateStatusDTO } from "@application/usecase/report/dto/update-status.dto";
import { UpdateReportUseCase } from "@application/usecase/report/update-report.usecase";
import { UpdateReportInput } from "../schemas/report/update-report.schema";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import logger from "@infrastructure/logger";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class CreateReportController {
    constructor(
        private useCase: CreateReportUseCase,
        private getReportUseCase: GetReportUseCase,
        private listUserReportsUseCase: ListUserReportsUseCase,
        private filteresUseCase: GetFilteredReportsUseCase,
        private updateStatusUseCase: UpdateStatus,
        private updateReportUseCase: UpdateReportUseCase
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
        res.status(201).json({ message: "Report created successfully", publicId: result.publicId });
    });


    list = asyncHandler(async (req: Request, res: Response): Promise<void> => {

        const pagination = this.validateListQuery(req.query);

        const userId = req.auth!.sub;
        if (!userId) {
            throw new UserNotFoundError();
        }

        const result = await this.listUserReportsUseCase.execute(userId, pagination);
        logger.info("Listed user reports successfully", {
            userId,
            page: pagination.page,
            limit: pagination.limit
        });
        res.status(200).json(result);

    });


    private validateListQuery(query: unknown): PaginationParams {
        const issues: string[] = [];
        const data = (query ?? {}) as { page?: unknown; limit?: unknown };

        let page = DEFAULT_PAGE;
        if (data.page !== undefined) {
            const parsed = Number(data.page);
            if (!Number.isInteger(parsed) || parsed < 1) {
                issues.push("page must be an integer greater than or equal to 1");
            } else {
                page = parsed;
            }
        }

        let limit = DEFAULT_LIMIT;
        if (data.limit !== undefined) {
            const parsed = Number(data.limit);
            if (!Number.isInteger(parsed) || parsed < 1) {
                issues.push("limit must be an integer greater than or equal to 1");
            } else if (parsed > MAX_LIMIT) {
                issues.push(`limit must be at most ${MAX_LIMIT}`);
            } else {
                limit = parsed;
            }
        }

        if (issues.length > 0) throw new ValidationError(issues);

        return { page, limit };
    }



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

    private buildCreateDTO(parsed: CreateReportInput, files: Express.Multer.File[]): CreateReportDTO {
        if (parsed.type === ReportType.LOST) {
            return { ...parsed, images: files.map(f => f.buffer) } as CreateReportDTO;
        }
        return { ...parsed, images: files.map(f => f.buffer) } as CreateReportDTO;
    }

    updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const dto = req.validated?.body as UpdateStatusDTO;
        const publicId = req.validated?.params.publicId;

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
}