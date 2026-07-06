import { Request, Response } from "express";
import { GetPublicProfileUseCase } from "@application/usecase/get-public-profile/get-public-profile.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetPublicProfileController {
  constructor(
    @inject("GetPublicProfileUseCase")
    private readonly getPublicProfileUseCase: GetPublicProfileUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = await this.getPublicProfileUseCase.execute(req.params.publicId as string);
    res.status(200).json(profile);
  });
}
