import type { PetRepository } from "@domain/pet/repositories/pet.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { PetMapper, PetOutput } from "./mapper/pet-mapper";
import { inject, injectable } from "tsyringe";

export type { PetOutput };

@injectable()
export class GetPetsUseCase {
    constructor(
        @inject("PetRepository")
        private petRepository: PetRepository,
        @inject("UserRepository")
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