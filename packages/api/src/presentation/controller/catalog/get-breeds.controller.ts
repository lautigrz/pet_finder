import { Request, Response } from "express";
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { GetBreedsQuery } from "@presentation/schemas/catalog/catalog.schema";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetBreedsController {
  constructor(
    @inject("GetBreedsUseCase")
    private readonly getBreedsUseCase: GetBreedsUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as GetBreedsQuery;
    const breeds = await this.getBreedsUseCase.execute(query?.animalType as AnimalType | undefined);
    res.status(200).json(breeds);
  });
}
