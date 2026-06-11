import { Request, Response } from "express";
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";
import { AnimalType, isValidAnimalType } from "@domain/shared/animal-type/animal-type";
import { asyncHandler } from "@presentation/handler/async-handler";
import { InvalidAnimalTypeError } from "@domain/errors/InvalidAnimalTypeError";

export class CatalogController {
    constructor(
        private readonly getBreedsUseCase: GetBreedsUseCase,
        private readonly getColorsUseCase: GetColorsUseCase,
    ) { }

    getBreeds = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const raw = req.query.animalType;
        const animalType = typeof raw === "string" ? raw : undefined;

        if (animalType && !isValidAnimalType(animalType)) {
            throw new InvalidAnimalTypeError("Type animal invalid");
        }


        const breeds = await this.getBreedsUseCase.execute(animalType as AnimalType | undefined);
        res.status(200).json(breeds);

    });

    getColors = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const colors = await this.getColorsUseCase.execute();
        res.status(200).json(colors);

    });
}
