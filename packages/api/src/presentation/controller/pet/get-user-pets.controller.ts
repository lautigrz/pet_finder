import { Request, Response } from "express";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetUserPetsController {
  constructor(
    @inject("GetPetsUseCase")
    private readonly getPetsUseCase: GetPetsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth!.sub;
    const pets = await this.getPetsUseCase.execute(userPublicId);
    logger.info("Fetched pets successfully", { userPublicId, count: pets.length });
    res.status(200).json(pets);
  });
}
