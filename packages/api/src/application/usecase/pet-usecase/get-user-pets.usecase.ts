import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { PetMapper, PetOutput } from "./mapper/pet-mapper";

export type { PetOutput };

export class GetPetsUseCase {
    constructor(
        private petRepository: PetRepository,
        private userRepository: IUserRepository,
    ) { }

    async execute(userPublicId: string): Promise<PetOutput[]> {
        const user = await this.userRepository.findByPublicId(userPublicId);
        if (!user || !user.internalId) {
            throw new Error("User not found");
        }

        const pets = await this.petRepository.findAllByUserId(user.internalId);
        return pets.map(PetMapper.toOutput);
    }
}