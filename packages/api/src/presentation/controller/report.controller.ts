import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { Request, Response } from "express";
import { createReportSchema } from "../schemas/create-report.schema";
import logger from "@infrastructure/logger/";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
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

export class CreateReportController {
    constructor(private useCase: CreateReportUseCase, private getReportUseCase: GetReportUseCase) { }


    create = async (req: Request, res: Response): Promise<void> => {
        const parsed = createReportSchema.safeParse(req.body);

        if (!parsed.success) {
            logger.warn("Validation error on report creation", {
                details: parsed.error.flatten(),
                body: req.body
            });
            res.status(400).json({
                error: "Validation error",
                details: parsed.error.flatten()
            });
            return;
        }


        try {
            const userId = req.auth!.sub;
            logger.info("User ID", { userId });
            if (!userId) {
                res.status(401).json({
                    error: "Unauthorizedd"
                });

                return;
            }

            await this.useCase.execute(parsed.data, userId);
            logger.info("Report created successfully", { type: parsed.data.type });
            res.status(201).json({ message: "Report created successfully" });
        } catch (error) {

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

}