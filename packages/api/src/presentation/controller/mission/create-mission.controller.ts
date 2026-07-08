import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateMissionUseCase } from "@application/usecase/mission-usecase/create-mission.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { CreateMissionInput } from "@presentation/schemas/mission/mission.schema";

@injectable()
export class CreateMissionController {

    constructor(

        @inject("CreateMissionUseCase")
        private readonly useCase: CreateMissionUseCase

    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const publicId = req.auth?.sub;
        if (!publicId) {
            throw new UserNotFoundError();
        }
        const parsed = req.validated?.body as CreateMissionInput;
        const result = await this.useCase.execute({
            reportPublicId: parsed.reportPublicId,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            title: parsed.title,
            description: parsed.description,
            radius: parsed.radius
        });

        res.status(201).json(result);

    });

}