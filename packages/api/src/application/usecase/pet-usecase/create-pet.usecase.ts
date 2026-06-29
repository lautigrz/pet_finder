import { Pet } from "@domain/pet/aggregates/PetAggregate";
import type { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import type { StorageService } from "@application/ports/StorageService";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { CreatePetDTO, CreatePetResponse } from "./dto/create-pet.dto";
import { inject, injectable } from "tsyringe";

export type { CreatePetDTO, CreatePetResponse };

@injectable()
export class CreatePetUseCase {
    constructor(
        @inject("PetRepository")
        private petRepository: PetRepository,
        @inject("StorageService")
        private storageService: StorageService,
        @inject("UserRepository")
        private userRepository: IUserRepository,
    ) { }

    async execute(dto: CreatePetDTO): Promise<CreatePetResponse> {
        const user = await this.userRepository.findByPublicId(dto.userPublicId);
        if (!user) {
            throw new Error("User not found");
        }

        const uploadedImages = await Promise.all(
            dto.images.map((buffer) =>
                this.storageService.upload(buffer, "pets")
            )
        );

        const petImages = uploadedImages.map((result) =>
            PetImage.create({ cloudinaryId: result.publicId, photoUrl: result.url })
        );

        const pet = Pet.create({
            userId: user.internalId!,
            name: dto.name,
            animalType: dto.animalType,
            genderType: dto.genderType,
            sizeType: dto.sizeType,
            color: dto.color,
            hasIdCollar: dto.hasIdCollar,
            isVaccinated: dto.isVaccinated,
            breed: dto.breed,
            petImage: petImages,
        });

        await this.petRepository.save(pet);

        return { publicId: pet.publicId };
    }
}