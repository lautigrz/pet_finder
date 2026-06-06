import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PrismaClient } from "@prisma/client";
import { PetMapper } from "./pet.mapper";
import { GenderTypeMap } from "@domain/shared/gender-type/gender-map";
import { AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";
import { SizeTypeMap } from "@domain/shared/size-type/size-map";

export class PrismaPetRepository implements PetRepository {

    constructor(private readonly prisma: PrismaClient) { }


    async findById(id: number): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { pet_id: id },
            include: {
                petImages: true
            }
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async save(pet: Pet): Promise<void> {
        const data = PetMapper.toPersistence(pet);
        await this.prisma.pet.create({ data });
    }

    async update(pet: Pet): Promise<void> {
        if (pet.idPet === null) {
            throw new Error('Pet id is required for update');
        }

        await this.prisma.pet.update({
            where: { pet_id: pet.idPet },
            data: {
                pet_name: pet.name,
                gender: { connect: { gender_id: GenderTypeMap[pet.genderType] } },
                animal_type: { connect: { animal_type_id: AnimalTypeMap[pet.animalType] } },
                size: { connect: { size_id: SizeTypeMap[pet.sizeType] } },
                has_id_collar: pet.hasIdCollar,
                is_vaccinated: pet.isVaccinated,
                breed: pet.breed,
                color: pet.color,
                updated_at: pet.updatedAt ?? new Date(),
            },
        });
    }

    async findByPublicId(publicId: string): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { public_id: publicId },
            include: {
                petImages: true
            }
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async findAllByUserId(userId: number): Promise<Pet[]> {

        const pets = await this.prisma.pet.findMany({
            where: { user_id: userId },
            include: {
                petImages: true
            }
        });

        return pets.map(PetMapper.toDomain);

    }
    delete(pet: Pet): Promise<void> {
        throw new Error("Method not implemented.");
    }
}