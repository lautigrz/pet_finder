import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { CreatePetDTO } from "@application/usecase/pet-usecase/dto/create-pet.dto";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { CreatePetInput, petSchema } from "../schemas/pet/pet.schema";
import { Request, Response } from "express";
import logger from "@infrastructure/logger/";
import { InvalidPetNameError } from "@domain/errors/InvalidPetNameError";

export class PetController {
    constructor(private useCase: CreatePetUseCase, private getPetsUseCase: GetPetsUseCase) { }

    create = async (req: Request, res: Response): Promise<void> => {
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        const parsed = req.validated?.body as CreatePetInput;

        if (!files.length) {
            logger.warn("Validation error on pet creation", {
                details: "No images uploaded",
                body: req.body
            });
            res.status(400).json({
                error: "Validation error",
                details: "No images uploaded"
            });
            return;
        }


        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {
            const dto = this.buildCreateDTO(parsed, files, userPublicId);
            const result = await this.useCase.execute(dto);
            logger.info("Pet created successfully", { publicId: result.publicId });
            res.status(201).json({ message: "Pet created successfully", publicId: result.publicId });
        } catch (error) {
            if (error instanceof InvalidPetNameError) {
                logger.warn("Business validation error on pet creation", { message: error.message });
                res.status(400).json({ error: error.message });
                return;
            }

            logger.error("Error creating pet", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                body: req.body
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    getAllByUserId = async (req: Request, res: Response): Promise<void> => {
        const userPublicId = req.auth?.sub;
        if (!userPublicId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {

            const pets = await this.getPetsUseCase.execute(userPublicId);
            logger.info("Fetched pets successfully", { userPublicId, count: pets.length });
            res.status(200).json(pets);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error fetching pets for user ${userPublicId}: ${errorMessage}`, {
                userPublicId,
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private buildCreateDTO(parsed: CreatePetInput, files: Express.Multer.File[], userPublicId: string): CreatePetDTO {
        return { ...parsed, userPublicId, images: files.map(f => f.buffer) };
    }
}