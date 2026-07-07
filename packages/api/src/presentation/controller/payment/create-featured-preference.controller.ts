import { Request, Response } from "express";
import { CreateFeaturedPreferenceUseCase } from "@application/usecase/payment-usecase/create-featured-preference.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateFeaturedPreferenceController {
  constructor(
    @inject("CreateFeaturedPreferenceUseCase")
    private readonly createFeaturedPreferenceUseCase: CreateFeaturedPreferenceUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userPublicId = req.auth?.sub;
    if (!userPublicId) throw new UserNotFoundError();

    const publicId = req.validated?.params.publicId as string;

    const result = await this.createFeaturedPreferenceUseCase.execute({
      reportPublicId: publicId,
      userPublicId,
    });

    logger.info("Featured payment preference created", { publicId });
    res.status(201).json(result);
  });
}
