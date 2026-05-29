import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PrismaClient } from "@prisma/client";
import { PetMapper } from "./pet.mapper";


export class PrismaPetRepository implements PetRepository {

    constructor(private readonly prisma: PrismaClient) { }


    async findById(id: number): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { pet_id: id },
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async save(pet: Pet): Promise<void> {
        const data = PetMapper.toPersistence(pet);
        await this.prisma.pet.create({ data });
    }

    async findByPublicId(publicId: string): Promise<Pet | null> {
        const pet = await this.prisma.pet.findUnique({
            where: { public_id: publicId },
        });

        return pet ? PetMapper.toDomain(pet) : null;
    }


    async findAllByUserId(userId: number): Promise<Pet[]> {

        const pets = await this.prisma.pet.findMany({
            where: { user_id: userId }
        });

        return pets.map(PetMapper.toDomain);

    }
    delete(pet: Pet): Promise<void> {
        throw new Error("Method not implemented.");
    }
}