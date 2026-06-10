import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { CatalogItem, CatalogRepository } from "@domain/catalog/catalog.repository";

export class GetBreedsUseCase {
    constructor(private readonly catalogRepository: CatalogRepository) { }

    execute(animalType?: AnimalType): Promise<CatalogItem[]> {
        return this.catalogRepository.listBreeds(animalType);
    }
}
