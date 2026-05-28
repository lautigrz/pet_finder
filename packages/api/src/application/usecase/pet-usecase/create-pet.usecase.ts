import { CreatePetParams, Pet } from "@domain/pet/aggregates/pet.aggregate";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";

type CreatePetResponse = {
    publicId: string;
};


export class CreatePetUseCase {
  constructor(private petRepository: PrismaPetRepository) {}


    async execute(dto: CreatePetParams): Promise<CreatePetResponse> {
        const pet = Pet.create(dto);    
        
        await this.petRepository.save(pet);

        return { publicId: pet.publicId };
    }
}