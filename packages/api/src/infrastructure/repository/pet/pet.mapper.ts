import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { GenderReverseTypeMap, GenderTypeMap } from "@domain/pet/types/gender-map";
import { SizeReverseTypeMap, SizeTypeMap } from "@domain/pet/types/size-map";
import { AnimalReverseTypeMap, AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";
import { Prisma } from "@prisma/client";
import { Pet as PrismaPet } from "@prisma/client";
export class PetMapper {

    static toPersistence(pet: Pet): Prisma.PetCreateInput {
        return {
            public_id: pet.publicId,
            user: { connect: { user_id: pet.userId } },
            pet_name: pet.name,
            gender: { connect: { gender_id: GenderTypeMap[pet.genderType] } },
            animal_type: { connect: { animal_type_id: AnimalTypeMap[pet.animalType] } },
            size: { connect: { size_id: SizeTypeMap[pet.sizeType] } },
            has_id_collar: pet.hasIdCollar,
            breed: pet.breed,
            color: pet.color,
            created_at: pet.createdAt,
        }
    }

    static toDomain(raw: PrismaPet): Pet {

        return Pet.restore({
            idPet: raw.pet_id,
            publicId: raw.public_id,
            userId: raw.user_id,
            name: raw.pet_name,
            animalType: AnimalReverseTypeMap[raw.animal_type_id]!,
            genderType: GenderReverseTypeMap[raw.gender_id]!,
            sizeType: SizeReverseTypeMap[raw.size_id]!,
            color: raw.color,
            hasIdCollar: raw.has_id_collar,
            breed: raw.breed!,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at
        });
    }
}