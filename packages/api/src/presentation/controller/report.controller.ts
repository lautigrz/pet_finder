import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { CreateReportDTO } from "@application/usecase/report/dto/create-report.dto";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { Request, Response } from "express";
import { CreateReportInput, createReportSchema } from "../schemas/report/create-report.schema";
import logger from "@infrastructure/logger/";
import { ValidationError } from "../errors/ValidationError";
import { PaginationParams } from "@domain/shared/pagination/pagination";
import { ListUserReportsUseCase } from "@application/usecase/report/list-user-reports.usecase";

import { InvalidCoordinatesError } from "@domain/errors/InvalidCoordinatesError";
import { InvalidLocationError } from "@domain/errors/InvalidLocationError";
import { InvalidReportDescriptionError } from "@domain/errors/InvalidReportDescriptionError";
import { InvalidStatusTransitionError } from "@domain/errors/InvalidStatusTransitionError";
import { InvalidReportDetailsError } from "@domain/errors/InvalidReportDetailsError";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import {
    MappingError,
    InvalidFieldError,
    InvalidReportTypeError
} from "@application/errors/errors";
import { ReportType } from "@domain/report/types/report.type";
import { GetFilteredReportsDTO } from "../schemas/report/report-filter.schema";
import { GetFilteredReportsUseCase } from "@application/usecase/report/get-filter-reports.usecase";
import { UpdateStatus } from "@application/usecase/report/update-status-report";
import { UpdateStatusDTO } from "@application/usecase/report/dto/update-status.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class CreateReportController {
    constructor(
        private useCase: CreateReportUseCase,
        private getReportUseCase: GetReportUseCase,
        private listUserReportsUseCase: ListUserReportsUseCase,
        private filteresUseCase: GetFilteredReportsUseCase,
        private updateStatusUseCase: UpdateStatus
    ) { }

    create = async (req: Request, res: Response): Promise<void> => {
        const parsed = req.validated?.body as CreateReportInput;
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];

        console.log(parsed);
        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {
            const dto = this.buildCreateDTO(parsed, files);
            const result = await this.useCase.execute(dto, userPublicId);
            logger.info("Report created successfully", { type: parsed.type });
            res.status(201).json({ message: "Report created successfully", publicId: result.publicId });
        } catch (error) {

            console.log(error);
            if (
                error instanceof InvalidCoordinatesError ||
                error instanceof InvalidLocationError ||
                error instanceof InvalidReportDescriptionError ||
                error instanceof InvalidStatusTransitionError ||
                error instanceof InvalidReportDetailsError ||
                error instanceof InvalidFieldError ||
                error instanceof InvalidReportTypeError ||
                error instanceof MappingError
            ) {
                logger.warn("Business validation error on report creation", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }

            if (error instanceof PetNotFoundError) {
                logger.warn("Dependency error on report creation", { message: error.message });
                res.status(404).json({ error: error.message });
                return;
            }

            logger.error("Error creating report", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                route: req.originalUrl,
                method: req.method,
                body: req.body
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }


    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = this.validateListQuery(req.query);

            const userId = req.auth!.sub;
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const result = await this.listUserReportsUseCase.execute(userId, pagination);
            logger.info("Listed user reports successfully", {
                userId,
                page: pagination.page,
                limit: pagination.limit
            });
            res.status(200).json(result);
        } catch (error) {

            if (error instanceof ValidationError) {
                logger.warn("Validation error on report listing", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }

            if (error instanceof PetNotFoundError) {
                logger.warn("Dependency error on report listing", { message: error.message });
                res.status(404).json({ error: error.message });
                return;
            }

            if (error instanceof MappingError) {
                logger.warn("Mapping error on report listing", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }

            logger.error("Error listing reports", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                route: req.originalUrl,
                method: req.method,
                query: req.query
            });
            res.status(500).json({ error: 'Internal server error' });
        }

    }


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



    getFilteres = async (req: Request, res: Response): Promise<void> => {
        try {

            const dto = req.validated?.query as GetFilteredReportsDTO;
            const reports = await this.filteresUseCase.execute(dto);

            logger.info("Filtered reports successfully", {
                query: dto,
                count: reports.length
            });
            res.status(200).json(reports);

        } catch (error) {
            if (error instanceof ValidationError) {
                logger.warn("Validation error on report filtering", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }

            if (error instanceof MappingError) {
                logger.warn("Mapping error on report filtering", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }
            logger.error("Error filtering reports", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                route: req.originalUrl,
                method: req.method,
                query: req.query
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }


    getByPublicId = async (req: Request, res: Response): Promise<void> => {
        const { publicId } = req.params;

        try {
            const report = await this.getReportUseCase.execute(publicId as string);
            logger.info("Fetched report successfully", { publicId });
            res.status(200).json(report);
        } catch (error) {
            if (error instanceof ReportNotFoundError) {
                logger.warn("Report not found", { publicId, message: error.message });
                res.status(404).json({ error: error.message });
                return;
            }

            logger.error("Error fetching report", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                route: req.originalUrl,
                method: req.method,
                params: req.params
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private buildCreateDTO(parsed: CreateReportInput, files: Express.Multer.File[]): CreateReportDTO {
        if (parsed.type === ReportType.LOST) {
            return parsed as CreateReportDTO;
        }
        return { ...parsed, images: files.map(f => f.buffer) } as CreateReportDTO;
    }

    updateStatus = async (req: Request, res: Response): Promise<void> => {
        try {
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
        } catch (error) {
            logger.error("Error updating report status", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                route: req.originalUrl,
                method: req.method,
                params: req.params,
                body: req.body
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}