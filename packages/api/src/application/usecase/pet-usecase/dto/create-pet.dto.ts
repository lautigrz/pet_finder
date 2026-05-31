import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";


export type CreatePetDTO = {
    userPublicId: string;
    name: string;
    animalType: AnimalType;
    genderType: GenderType;
    sizeType: SizeType;
    color: string;
    hasIdCollar: boolean;
    breed: string;
    images: Buffer[];
};


export type CreatePetResponse = {
    publicId: string;
};
