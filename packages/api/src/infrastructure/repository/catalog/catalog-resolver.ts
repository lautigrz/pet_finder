import { PrismaClient } from "@prisma/client";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";

export class CatalogResolver {
    constructor(private readonly prisma: PrismaClient) { }

    async colorId(name: string): Promise<number> {
        const match = await this.prisma.color.findFirst({
            where: { name: { equals: name.trim(), mode: "insensitive" } },
        });
        if (match) return match.color_id;

        const fallback = await this.prisma.color.findFirst({ where: { name: "Otro" } });
        if (!fallback) throw new Error('Catálogo de colores sin inicializar (falta "Otro")');
        return fallback.color_id;
    }

    async breedId(name: string | null | undefined, animalType: AnimalType): Promise<number | null> {
        const trimmed = name?.trim();
        if (!trimmed) return null;

        const match = await this.prisma.breed.findFirst({
            where: {
                name: { equals: trimmed, mode: "insensitive" },
                animal_type_id: AnimalTypeMap[animalType],
            },
        });
        return match?.breed_id ?? null;
    }
}
