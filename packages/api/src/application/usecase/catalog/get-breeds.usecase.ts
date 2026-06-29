import { AnimalType } from "@domain/shared/animal-type/animal-type";
import type { CatalogItem, CatalogRepository } from "@domain/catalog/catalog.repository";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetBreedsUseCase {
    constructor(
        @inject("CatalogRepository")
        private readonly catalogRepository: CatalogRepository
    ) { }

    execute(animalType?: AnimalType): Promise<CatalogItem[]> {
        return this.catalogRepository.listBreeds(animalType);
    }
}
