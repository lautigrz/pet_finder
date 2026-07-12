import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { asyncHandler } from "@presentation/handler/async-handler";
import { GetMissionCoverageUseCase } from "@application/usecase/mission-usecase/get-mission-coverage.usecase";

@injectable()
export class GetCoverageController {
    constructor(
        @inject("GetMissionCoverageUseCase")
        private readonly useCase: GetMissionCoverageUseCase
    ) { }

    handle = asyncHandler(async (req: Request, res: Response) => {
        const publicId = req.params.publicId;
        const sinceQuery = req.query.since;
        
        let since: Date | undefined = undefined;
        if (sinceQuery && typeof sinceQuery === 'string') {
            const date = new Date(sinceQuery);
            if (!isNaN(date.getTime())) {
                since = date;
            }
        }

        const result = await this.useCase.execute(publicId as string, since);
        
        res.status(200).json({
            status: "success",
            cells: result.cells,
            lastSyncTimestamp: result.lastSyncTimestamp.toISOString()
        });
    });
}
