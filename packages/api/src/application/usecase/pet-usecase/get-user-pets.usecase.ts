import { Pet } from "@domain/pet/aggregates/pet.aggregate";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";

export class GetPetsUseCase {
  constructor(private petRepository: PrismaPetRepository) {}


    async execute(userId: number): Promise<Pet[]> {
        return this.petRepository.findAllByUserId(1);
    }
}