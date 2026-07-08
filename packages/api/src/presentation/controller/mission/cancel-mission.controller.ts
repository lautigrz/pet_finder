import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { CancelMissionUseCase } from "@application/usecase/mission-usecase/cancel-mission.usecase";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

@injectable()
export class CancelMissionController {
    constructor(
        @inject("CancelMissionUseCase")
        private readonly useCase: CancelMissionUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const publicId = req.params.publicId;
        const userPublicId = req.auth?.sub;
        await this.useCase.execute(publicId as string, userPublicId as string);
        res.status(200).json({ status: "success", message: "Mission canceled" });
    });
}
