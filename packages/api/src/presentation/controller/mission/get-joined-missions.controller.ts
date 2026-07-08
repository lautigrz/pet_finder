import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetJoinedMissionsUseCase } from "@application/usecase/mission-usecase/get-joined-missions.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class GetJoinedMissionsController {
    constructor(
        @inject("GetJoinedMissionsUseCase")
        private readonly useCase: GetJoinedMissionsUseCase
    ) {}

    handle = asyncHandler(async (req: Request, res: Response) => {
        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            throw new UserNotFoundError();
        }

        const missions = await this.useCase.execute(userPublicId);
        res.status(200).json(missions);
    });
}
