import { AnimalType } from "@domain/shared/animal-type/animal-type";

export interface CatalogItem {
    id: number;
    name: string;
}

export interface CatalogRepository {
    listBreeds(animalType?: AnimalType): Promise<CatalogItem[]>;
    listColors(): Promise<CatalogItem[]>;
}
