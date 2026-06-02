import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { StorageService } from "@application/ports/StorageService";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { CreatePetDTO, CreatePetResponse } from "./dto/create-pet.dto";

export type { CreatePetDTO, CreatePetResponse };

export class CreatePetUseCase {
    constructor(
        private petRepository: PetRepository,
        private storageService: StorageService,
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