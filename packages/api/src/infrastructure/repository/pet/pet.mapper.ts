import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { GenderReverseTypeMap, GenderTypeMap } from "@domain/shared/gender-type/gender-map";
import { SizeReverseTypeMap, SizeTypeMap } from "@domain/shared/size-type/size-map";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { AnimalReverseTypeMap, AnimalTypeMap } from "@domain/shared/animal-type/animal-type-map";
import { Prisma } from "@prisma/client";

type PrismaPetWithImages = Prisma.PetGetPayload<{
    include: {
        petImages: true,
        color: true,
        breed: true
    }
}>;


export class PetMapper {

    static toPersistence(pet: Pet, colorId: number, breedId: number | null): Prisma.PetCreateInput {
        return {
            public_id: pet.publicId,
            user: { connect: { user_id: pet.userId } },
            pet_name: pet.name,
            gender: { connect: { gender_id: GenderTypeMap[pet.genderType] } },
            animal_type: { connect: { animal_type_id: AnimalTypeMap[pet.animalType] } },
            size: { connect: { size_id: SizeTypeMap[pet.sizeType] } },
            has_id_collar: pet.hasIdCollar,
            is_vaccinated: pet.isVaccinated,
            color: { connect: { color_id: colorId } },
            ...(breedId !== null ? { breed: { connect: { breed_id: breedId } } } : {}),
            petImages: {
                create: pet.images.map(img => ({
                    cloudinaryId: img.cloudinaryId,
                    photoUrl: img.photoUrl
                }))
            },
            suspicious: pet.suspicious,
            suspicious_reasons: pet.suspiciousReasons,
            created_at: pet.createdAt,
        }
    }

    static toDomain(raw: PrismaPetWithImages): Pet {

        return Pet.restore({
            idPet: raw.pet_id,
            publicId: raw.public_id,
            userId: raw.user_id,
            name: raw.pet_name,
            animalType: AnimalReverseTypeMap[raw.animal_type_id]!,
            genderType: GenderReverseTypeMap[raw.gender_id]!,
            sizeType: SizeReverseTypeMap[raw.size_id]!,
            color: raw.color.name,
            hasIdCollar: raw.has_id_collar,
            isVaccinated: raw.is_vaccinated,
            breed: raw.breed?.name ?? '',
            petImage: raw.petImages.map(img => PetImage.create({
                cloudinaryId: img.cloudinaryId,
                photoUrl: img.photoUrl
            })),
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
            suspicious: raw.suspicious,
            suspiciousReasons: raw.suspicious_reasons
        });
    }
}