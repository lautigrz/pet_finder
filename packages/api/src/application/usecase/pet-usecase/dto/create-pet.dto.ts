import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";


export type CreatePetDTO = {
    userPublicId: string;
    name: string;
    animalType: AnimalType;
    genderType: GenderType;
    sizeType: SizeType;
    color: string;
    hasIdCollar: boolean;
    isVaccinated: boolean;
    breed: string;
    images: Buffer[];
};


export type CreatePetResponse = {
    publicId: string;
};
