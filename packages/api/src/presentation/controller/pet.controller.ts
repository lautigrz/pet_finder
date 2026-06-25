import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { CreatePetDTO } from "@application/usecase/pet-usecase/dto/create-pet.dto";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { CreatePetInput } from "../schemas/pet/pet.schema";
import { Request, Response } from "express";
import { logger } from '@pet-alert/shared';
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class PetController {
    constructor(
        @inject("CreatePetUseCase")
        private useCase: CreatePetUseCase,
        @inject("GetPetsUseCase")
        private getPetsUseCase: GetPetsUseCase,
    ) { }

    create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        const parsed = req.validated?.body as CreatePetInput;

        const userPublicId = req.auth?.sub;

        const dto = this.buildCreateDTO(parsed, files, userPublicId!);
        const result = await this.useCase.execute(dto);
        logger.info("Pet created successfully", { publicId: result.publicId });
        res.status(201).json({ message: "Pet created successfully", publicId: result.publicId });

    });

    getAllByUserId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;

        const pets = await this.getPetsUseCase.execute(userPublicId!);
        logger.info("Fetched pets successfully", { userPublicId, count: pets.length });
        res.status(200).json(pets);
    });

    private buildCreateDTO(parsed: CreatePetInput, files: Express.Multer.File[], userPublicId: string): CreatePetDTO {
        return { ...parsed, userPublicId, images: files.map(f => f.buffer) };
    }
}