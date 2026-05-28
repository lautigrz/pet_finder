
import { Pet } from "@domain/pet/aggregates/pet.aggregate";

export class PetPresenter {
  static toResponse(pet: Pet) {
    return {
      publicId: pet.publicId,
      name: pet.name,
      animalType: pet.animalType,
      genderType: pet.genderType,
      sizeType: pet.sizeType,
      color: pet.color,
      hasIdCollar: pet.hasIdCollar,
      breed: pet.breed,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt?.toISOString() ?? null
    };
  }
}