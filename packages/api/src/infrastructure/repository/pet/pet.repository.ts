import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PrismaClient } from "@prisma/client";
import { PetMapper } from "./pet.mapper";
import { GenderTypeMap } from "@domain/shared/gender-type/gender-map";
import { AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";
import { SizeTypeMap } from "@domain/shared/size-type/size-map";
import { CatalogResolver } from "../catalog/catalog-resolver";

export class PrismaPetRepository implements PetRepository {
    private readonly catalog: CatalogResolver;

    constructor(private readonly prisma: PrismaClient) {
        this.catalog = new CatalogResolver(prisma);
    }


    async findById(id: number): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { pet_id: id },
            include: {
                petImages: true,
                color: true,
                breed: true
            }
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async save(pet: Pet): Promise<void> {
        const colorId = await this.catalog.colorId(pet.color);
        const breedId = await this.catalog.breedId(pet.breed, pet.animalType);
        const data = PetMapper.toPersistence(pet, colorId, breedId);
        await this.prisma.pet.create({ data });
    }

    async update(pet: Pet): Promise<void> {
        if (pet.idPet === null) {
            throw new Error('Pet id is required for update');
        }

        const colorId = await this.catalog.colorId(pet.color);
        const breedId = await this.catalog.breedId(pet.breed, pet.animalType);

        await this.prisma.pet.update({
            where: { pet_id: pet.idPet },
            data: {
                pet_name: pet.name,
                gender: { connect: { gender_id: GenderTypeMap[pet.genderType] } },
                animal_type: { connect: { animal_type_id: AnimalTypeMap[pet.animalType] } },
                size: { connect: { size_id: SizeTypeMap[pet.sizeType] } },
                has_id_collar: pet.hasIdCollar,
                is_vaccinated: pet.isVaccinated,
                color: { connect: { color_id: colorId } },
                ...(breedId !== null
                    ? { breed: { connect: { breed_id: breedId } } }
                    : { breed: { disconnect: true } }),
                updated_at: pet.updatedAt ?? new Date(),
            },
        });
    }

    async findByPublicId(publicId: string): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { public_id: publicId },
            include: {
                petImages: true,
                color: true,
                breed: true
            }
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async findAllByUserId(userId: number): Promise<Pet[]> {

        const pets = await this.prisma.pet.findMany({
            where: { user_id: userId },
            include: {
                petImages: true,
                color: true,
                breed: true
            }
        });

        return pets.map(PetMapper.toDomain);

    }
    delete(pet: Pet): Promise<void> {
        throw new Error("Method not implemented.");
    }
}