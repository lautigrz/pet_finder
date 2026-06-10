import { PrismaClient } from "@prisma/client";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";
import { CatalogItem, CatalogRepository } from "@domain/catalog/catalog.repository";

export class PrismaCatalogRepository implements CatalogRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async listBreeds(animalType?: AnimalType): Promise<CatalogItem[]> {
        const breeds = await this.prisma.breed.findMany({
            where: animalType ? { animal_type_id: AnimalTypeMap[animalType] } : undefined,
            orderBy: { breed_id: "asc" },
        });
        return breeds.map((breed) => ({ id: breed.breed_id, name: breed.name }));
    }

    async listColors(): Promise<CatalogItem[]> {
        const colors = await this.prisma.color.findMany({ orderBy: { color_id: "asc" } });
        return colors.map((color) => ({ id: color.color_id, name: color.name }));
    }
}
