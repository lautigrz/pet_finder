import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { UpdateMissionUseCase } from "@application/usecase/mission-usecase/update-mission.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UpdateMissionInput } from "@presentation/schemas/mission/mission.schema";
import { logger } from "@pet-alert/shared";

@injectable()
export class UpdateMissionController {

    constructor(
        @inject("UpdateMissionUseCase")
        private readonly useCase: UpdateMissionUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            throw new UserNotFoundError();
        }

        const missionPublicId = req.params.publicId as string;
        const parsed = req.validated?.body as UpdateMissionInput;

        await this.useCase.execute({
            missionPublicId,
            userPublicId,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            radius: parsed.radius,
            title: parsed.title,
            description: parsed.description
        });

        logger.info("Mission updated successfully", { missionPublicId });
        res.sendStatus(204);
    });
}
