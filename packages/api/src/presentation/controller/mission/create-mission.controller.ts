import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateMissionUseCase } from "@application/usecase/mission-usecase/create-mission.usecase";

@injectable()
export class CreateMissionController {

    constructor(

        @inject("CreateMissionUseCase")
        private readonly useCase: CreateMissionUseCase

    ) {}

    handle = asyncHandler(async (req: Request, res: Response) => {

        const result = await this.useCase.execute({

            reportPublicId: req.body.reportPublicId,

            latitude: req.body.latitude,

            longitude: req.body.longitude,

            title: req.body.title,

    description: req.body.description,

            radius: req.body.radius

        });

        res.status(201).json(result);

    });

}