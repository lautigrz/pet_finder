import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";

export class GetPetsUseCase {
  constructor(private petRepository: PetRepository) { }


  async execute(userId: number): Promise<Pet[]> {
    return this.petRepository.findAllByUserId(userId);
  }
}