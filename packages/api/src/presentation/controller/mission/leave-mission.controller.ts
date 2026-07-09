import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { LeaveMissionUseCase } from "@application/usecase/mission-usecase/leave-mission.usecase";

@injectable()
export class LeaveMissionController {
    constructor(
        @inject("LeaveMissionUseCase")
        private readonly useCase: LeaveMissionUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const { publicId } = req.params;
        const userPublicId = req.auth!.sub;

        await this.useCase.execute(publicId as string, userPublicId);
        res.status(200).json({ status: "success", message: "Left mission" });
    });
}
