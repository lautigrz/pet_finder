import { Request, Response } from "express";
import { UpdateProfileUseCase } from "@application/usecase/update-profile/update-profile.usecase";
import { UpdateProfileInput } from "@application/usecase/update-profile/update-profile.input";
import type { StorageService } from "@application/ports/StorageService";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class UploadProfilePhotoController {
  constructor(
    @inject("UpdateProfileUseCase")
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    @inject("StorageService")
    private readonly storageService: StorageService,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "photo is required" });
      return;
    }

    const uploadedImage = await this.storageService.upload(req.file.buffer, "profiles");
    const updated = await this.updateProfileUseCase.execute(
      new UpdateProfileInput(
        req.auth!.sub,
        undefined,
        undefined,
        undefined,
        uploadedImage.url,
      ),
    );
    res.status(200).json(updated);
  });
}
