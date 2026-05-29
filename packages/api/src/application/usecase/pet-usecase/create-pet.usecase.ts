import { CreatePetParams, Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";

type CreatePetResponse = {
    publicId: string;
};


export class CreatePetUseCase {
    constructor(private petRepository: PetRepository) { }


    async execute(dto: CreatePetParams): Promise<CreatePetResponse> {
        const pet = Pet.create(dto);

        await this.petRepository.save(pet);

        return { publicId: pet.publicId };
    }
}