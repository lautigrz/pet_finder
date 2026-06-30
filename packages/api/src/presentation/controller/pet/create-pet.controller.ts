import { Request, Response } from "express";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { CreatePetDTO } from "@application/usecase/pet-usecase/dto/create-pet.dto";
import { asyncHandler } from "@presentation/handler/async-handler";
import { CreatePetInput } from "@presentation/schemas/pet/pet.schema";
import { logger } from "@pet-alert/shared";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreatePetController {
  constructor(
    @inject("CreatePetUseCase")
    private readonly createPetUseCase: CreatePetUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const parsed = req.validated?.body as CreatePetInput;
    const userPublicId = req.auth!.sub;

    const dto: CreatePetDTO = { ...parsed, userPublicId, images: files.map((f) => f.buffer) };
    const result = await this.createPetUseCase.execute(dto);

    logger.info("Pet created successfully", { publicId: result.publicId });
    res.status(201).json({ message: "Pet created successfully", publicId: result.publicId });
  });
}
