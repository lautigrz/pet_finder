import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionsUseCase } from "@application/usecase/mission-usecase/get-missions.usecase";

@injectable()
export class GetMissionsController {

    constructor(

        @inject("GetMissionsUseCase")
        private readonly useCase: GetMissionsUseCase

    ) {}

    handle = asyncHandler(async (_req: Request, res: Response) => {

        const missions = await this.useCase.execute();

        res.status(200).json(missions);

    });

}