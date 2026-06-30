import { Request, Response } from "express";
import { GetProfileUseCase } from "@application/usecase/get-profile/get-profile.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetProfileController {
  constructor(
    @inject("GetProfileUseCase")
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = await this.getProfileUseCase.execute(req.auth!.sub);
    res.status(200).json(profile);
  });
}
