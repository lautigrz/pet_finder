import { Request, Response } from "express";
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { asyncHandler } from "@presentation/handler/async-handler";
import { GetBreedsQuery } from "../schemas/catalog/catalog.schema";

export class CatalogController {
    constructor(
        private readonly getBreedsUseCase: GetBreedsUseCase,
        private readonly getColorsUseCase: GetColorsUseCase,
    ) { }

    getBreeds = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const query = req.validated?.query as GetBreedsQuery;
        const breeds = await this.getBreedsUseCase.execute(query?.animalType as AnimalType | undefined);
        res.status(200).json(breeds);
    });

    getColors = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const colors = await this.getColorsUseCase.execute();
        res.status(200).json(colors);
    });
}
