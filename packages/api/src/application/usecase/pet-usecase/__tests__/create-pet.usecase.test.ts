import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { StorageService } from "@application/ports/StorageService";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { User } from "@domain/entities/User";

const fakeUser = User.reconstruct(
    42,
    "user-public-uuid",
    "test@test.com",
    "testuser",
    "$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    true,
    new Date(),
    null,
    null,
    null,
);

const validDto = {
    userPublicId: "user-public-uuid",
    name: "Firulais",
    animalType: AnimalType.DOG,
    genderType: GenderType.MALE,
    sizeType: SizeType.MEDIUM,
    color: "brown",
    hasIdCollar: true,
    isVaccinated: true,
    breed: "Labrador",
    images: [Buffer.from("fake-image")],
};

describe("CreatePetUseCase", () => {
    let petRepository: PetRepository;
    let storageService: StorageService;
    let userRepository: IUserRepository;
    let useCase: CreatePetUseCase;

    beforeEach(() => {
        petRepository = {
            save: vi.fn().mockResolvedValue(undefined),
            findByPublicId: vi.fn(),
            findById: vi.fn(),
            findAllByUserId: vi.fn(),
            delete: vi.fn(),
        } as unknown as PetRepository;

        storageService = {
            upload: vi.fn().mockResolvedValue({ url: "https://fake.url/img.jpg", publicId: "pets/fake-id" }),
            delete: vi.fn(),
        } as unknown as StorageService;

        userRepository = {
            save: vi.fn(),
            findByEmail: vi.fn(),
            markVerified: vi.fn(),
            findByPublicId: vi.fn().mockResolvedValue(fakeUser),
            updateProfile: vi.fn(),
        } as unknown as IUserRepository;

        useCase = new CreatePetUseCase(petRepository, storageService, userRepository);
    });

    it("busca al usuario por publicId antes de crear la mascota", async () => {
        await useCase.execute(validDto);
        expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-public-uuid");
    });

    it("sube las imágenes, guarda la mascota y retorna un publicId de tipo UUID", async () => {
        const result = await useCase.execute(validDto);

        expect(storageService.upload).toHaveBeenCalledOnce();
        expect(petRepository.save).toHaveBeenCalledOnce();
        expect(result.publicId).toBeDefined();
        expect(result.publicId).toHaveLength(36);
    });

    it("lanza error si el usuario no existe", async () => {
        vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);
        await expect(useCase.execute(validDto)).rejects.toThrow("User not found");
    });

    it("propaga el error si el repositorio falla", async () => {
        vi.mocked(petRepository.save).mockRejectedValue(new Error("DB error"));
        await expect(useCase.execute(validDto)).rejects.toThrow("DB error");
    });

    it("propaga el error si el storage falla", async () => {
        vi.mocked(storageService.upload).mockRejectedValue(new Error("Cloudinary error"));
        await expect(useCase.execute(validDto)).rejects.toThrow("Cloudinary error");
    });

    it("guarda la mascota con el internalId del usuario", async () => {
        await useCase.execute(validDto);
        const savedPet = vi.mocked(petRepository.save).mock.calls[0]?.[0];
        expect(savedPet?.userId).toBe(42);
        expect(savedPet?.name).toBe("Firulais");
        expect(savedPet?.animalType).toBe(AnimalType.DOG);
        expect(savedPet?.isVaccinated).toBe(true);
    });
});
