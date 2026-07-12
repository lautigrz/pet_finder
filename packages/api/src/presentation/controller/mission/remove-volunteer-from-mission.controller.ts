import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { asyncHandler } from "@presentation/handler/async-handler";
import { RemoveVolunteerFromMissionUseCase } from "@application/usecase/mission-usecase/remove-volunteer-from-mission.usecase";

@injectable()
export class RemoveVolunteerFromMissionController {
    constructor(
        @inject("RemoveVolunteerFromMissionUseCase")
        private readonly useCase: RemoveVolunteerFromMissionUseCase,
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const { publicId, volunteerPublicId } = req.params;
        const ownerPublicId = req.auth!.sub;

        await this.useCase.execute(publicId as string, ownerPublicId, volunteerPublicId as string);
        res.status(200).json({
            status: "success",
            message: "Voluntario eliminado de la misión correctamente"
        });
    });
}