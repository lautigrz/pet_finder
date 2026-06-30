import { Request, Response } from "express";
import { UpdateProfileUseCase } from "@application/usecase/update-profile/update-profile.usecase";
import { UpdateProfileInput } from "@application/usecase/update-profile/update-profile.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UpdateProfileBody } from "@presentation/schemas/user/user.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateProfileController {
  constructor(
    @inject("UpdateProfileUseCase")
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as UpdateProfileBody;
    const updated = await this.updateProfileUseCase.execute(
      new UpdateProfileInput(
        req.auth!.sub,
        body.name,
        body.lastname,
        body.username,
        body.photoUrl,
      ),
    );
    res.status(200).json(updated);
  });
}
