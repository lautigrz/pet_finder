import { Pet } from "@domain/pet/aggregates/pet.aggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";

export class GetPetsUseCase {
  constructor(private petRepository: PetRepository) {}


    async execute(userId: number): Promise<Pet[]> {
        return this.petRepository.findAllByUserId(userId);
    }
}