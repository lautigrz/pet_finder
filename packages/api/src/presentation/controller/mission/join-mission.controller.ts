import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { JoinMissionUseCase } from "@application/usecase/mission-usecase/join-mission.usecase";

@injectable()
export class JoinMissionController {
    constructor(
        @inject("JoinMissionUseCase")
        private readonly useCase: JoinMissionUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const { publicId } = req.params;
        const userPublicId = req.auth!.sub;


        await this.useCase.execute(publicId as string, userPublicId);
        res.status(200).json({ status: "success", message: "Joined mission" });
    });
}
