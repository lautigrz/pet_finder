import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { petSchema } from "../schemas/pet.schema";
import { Request, Response } from "express";
import { PetPresenter } from "../dto/pet/pet-presenter";
import logger from "@infrastructure/logger/";
import { InvalidPetNameError } from "@domain/errors/InvalidPetNameError";

export class PetController {
    constructor(private useCase: CreatePetUseCase, private getPetsUseCase: GetPetsUseCase) { }

    create = async (req: Request, res: Response): Promise<void> => {
        const parsed = petSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn("Validation error on pet creation", {
                details: parsed.error.flatten(),
                body: req.body
            });
            res.status(400).json({
                error: "Validation error",
                details: parsed.error.flatten()
            });
            return;
        }

        try {
            const result = await this.useCase.execute(parsed.data);
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
        const userId = 1; // TODO: reemplazar con el userId del usuario autenticado (req.user.id)

        try {
            const pets = await this.getPetsUseCase.execute(userId);
            const responseBody = pets.map(pet => PetPresenter.toResponse(pet));
            logger.info("Fetched pets successfully", { userId, count: pets.length });
            res.status(200).json(responseBody);
        } catch (error) {
            logger.error("Error fetching pets for user", {
                userId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

}