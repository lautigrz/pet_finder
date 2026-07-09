import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { GetUserExperienceUseCase } from "@application/usecase/get-user-experience/get-user-experience.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";

@injectable()
export class GetPublicUserExperienceController {
  constructor(
    @inject("GetUserExperienceUseCase")
    private readonly getUserExperienceUseCase: GetUserExperienceUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const experience = await this.getUserExperienceUseCase.execute(req.params.publicId as string);
    res.status(200).json(experience);
  });
}
