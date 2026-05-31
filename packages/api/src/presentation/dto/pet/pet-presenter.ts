import { PetMapper, PetOutput } from "@application/usecase/pet-usecase/mapper/pet-mapper";
import { Pet } from "@domain/pet/aggregates/PetAggregate";


export class PetPresenter {
    static toResponse(pet: Pet): PetOutput {
        return PetMapper.toOutput(pet);
    }
}