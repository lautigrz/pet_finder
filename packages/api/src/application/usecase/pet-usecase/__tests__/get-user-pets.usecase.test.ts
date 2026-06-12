import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { User } from "@domain/entities/User";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { PetImage } from "@domain/pet/value-objects/image.vo";

const fakeUser = User.reconstruct(
    1,
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

const makePet = (name: string) =>
    Pet.restore({
        idPet: 1,
        publicId: "pet-uuid",
        userId: 1,
        name,
        animalType: AnimalType.DOG,
        genderType: GenderType.MALE,
        sizeType: SizeType.MEDIUM,
        isVaccinated: false,
        color: "brown",
        hasIdCollar: false,
        breed: "Mix",
        petImage: [PetImage.create({
            cloudinaryId: "fake-id",
            photoUrl: "https://fake.com/img.jpg",
        })],
        createdAt: new Date(),
    });

describe("GetPetsUseCase", () => {
    let petRepository: PetRepository;
    let userRepository: IUserRepository;
    let useCase: GetPetsUseCase;

    beforeEach(() => {
        petRepository = {
            save: vi.fn(),
            findByPublicId: vi.fn(),
            findById: vi.fn(),
            findAllByUserId: vi.fn(),
            delete: vi.fn(),
        } as unknown as PetRepository;

        userRepository = {
            save: vi.fn(),
            findByEmail: vi.fn(),
            markVerified: vi.fn(),
            findByPublicId: vi.fn().mockResolvedValue(fakeUser),
            updateProfile: vi.fn(),
        } as unknown as IUserRepository;

        useCase = new GetPetsUseCase(petRepository, userRepository);
    });

    it("retorna la lista de mascotas mapeadas a PetOutput", async () => {
        const pets = [makePet("Firulais"), makePet("Max")];
        vi.mocked(petRepository.findAllByUserId).mockResolvedValue(pets);

        const result = await useCase.execute("user-public-uuid");

        expect(result).toHaveLength(2);
        expect(result[0]?.name).toBe("Firulais");
        expect(result[1]?.name).toBe("Max");
        // Verificar que no expone cloudinaryId
        expect(result[0]).not.toHaveProperty("cloudinaryId");
        expect(result[0]).toHaveProperty("publicId");
    });

    it("retorna un array vacío si el usuario no tiene mascotas", async () => {
        vi.mocked(petRepository.findAllByUserId).mockResolvedValue([]);

        const result = await useCase.execute("user-public-uuid");

        expect(result).toHaveLength(0);
    });

    it("lanza error si el usuario no existe", async () => {
        vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

        await expect(useCase.execute("no-existe")).rejects.toThrow("User not found");
    });

    it("propaga el error si el repositorio falla", async () => {
        vi.mocked(petRepository.findAllByUserId).mockRejectedValue(new Error("Connection lost"));

        await expect(useCase.execute("user-public-uuid")).rejects.toThrow("Connection lost");
    });
});
