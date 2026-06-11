import { Request, Response } from "express";
import logger from "@infrastructure/logger/";
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";
import { AnimalType, isValidAnimalType } from "@domain/shared/animal-type/animal-type";

export class CatalogController {
    constructor(
        private readonly getBreedsUseCase: GetBreedsUseCase,
        private readonly getColorsUseCase: GetColorsUseCase,
    ) { }

    getBreeds = async (req: Request, res: Response): Promise<void> => {
        const raw = req.query.animalType;
        const animalType = typeof raw === "string" ? raw : undefined;

        if (animalType && !isValidAnimalType(animalType)) {
            res.status(400).json({ error: "animalType inválido" });
            return;
        }

        try {
            const breeds = await this.getBreedsUseCase.execute(animalType as AnimalType | undefined);
            res.status(200).json(breeds);
        } catch (error) {
            logger.error("Error fetching breeds", {
                error: error instanceof Error ? error.message : String(error),
            });
            res.status(500).json({ error: "Internal server error" });
        }
    };

    getColors = async (_req: Request, res: Response): Promise<void> => {
        try {
            const colors = await this.getColorsUseCase.execute();
            res.status(200).json(colors);
        } catch (error) {
            logger.error("Error fetching colors", {
                error: error instanceof Error ? error.message : String(error),
            });
            res.status(500).json({ error: "Internal server error" });
        }
    };
}
