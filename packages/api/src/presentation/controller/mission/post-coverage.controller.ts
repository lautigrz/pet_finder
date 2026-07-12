import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { asyncHandler } from "@presentation/handler/async-handler";
import { AddMissionCoverageUseCase } from "@application/usecase/mission-usecase/add-mission-coverage.usecase";

@injectable()
export class PostCoverageController {
    constructor(
        @inject("AddMissionCoverageUseCase")
        private readonly useCase: AddMissionCoverageUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const publicId = req.params.publicId;
        const userPublicId = req.auth?.sub;
        const { cells } = req.body;

        if (!Array.isArray(cells)) {
            res.status(400).json({ status: "error", message: "cells must be an array of strings" });
            return;
        }

        await this.useCase.execute(publicId as string, userPublicId as string, cells as string[]);
        res.status(201).json({ status: "success", message: "Coverage saved" });
    });
}
