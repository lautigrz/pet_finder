import { Pet } from "@domain/pet/aggregates/PetAggregate";


export type PetImageOutput = {
    url: string;
};


export type PetOutput = {
    publicId: string;
    name: string;
    animalType: string;
    genderType: string;
    sizeType: string;
    color: string;
    hasIdCollar: boolean;
    breed: string;
    images: PetImageOutput[];
    createdAt: string;
    updatedAt: string | null;
};

export class PetMapper {
    static toOutput(pet: Pet): PetOutput {
        return {
            publicId: pet.publicId,
            name: pet.name,
            animalType: pet.animalType,
            genderType: pet.genderType,
            sizeType: pet.sizeType,
            color: pet.color,
            hasIdCollar: pet.hasIdCollar,
            breed: pet.breed,
            images: pet.images.map((img) => ({ url: img.photoUrl })),
            createdAt: pet.createdAt.toISOString(),
            updatedAt: pet.updatedAt?.toISOString() ?? null,
        };
    }
}