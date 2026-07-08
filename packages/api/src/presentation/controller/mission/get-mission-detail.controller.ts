import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionDetailUseCase } from "@application/usecase/mission-usecase/get-mission-detail.usecase";


@injectable()
export class GetMissionDetailController {
    constructor(
        @inject("GetMissionDetailUseCase")
        private readonly useCase: GetMissionDetailUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const { publicId } = req.params;
        const result = await this.useCase.execute(publicId as string);
        res.status(200).json(result);
    });
}
