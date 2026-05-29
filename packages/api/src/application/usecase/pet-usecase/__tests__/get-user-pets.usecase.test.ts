import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";

const makePet = (name: string) =>
  Pet.restore({
    idPet: 1,
    publicId: "pet-uuid",
    userId: 1,
    name,
    animalType: AnimalType.DOG,
    genderType: GenderType.MALE,
    sizeType: SizeType.MEDIUM,
    color: "brown",
    hasIdCollar: false,
    breed: "Mix",
    createdAt: new Date(),
  });

describe("GetPetsUseCase", () => {
  let petRepository: PrismaPetRepository;
  let useCase: GetPetsUseCase;

  beforeEach(() => {
    petRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      delete: vi.fn(),
    } as unknown as PrismaPetRepository;

    useCase = new GetPetsUseCase(petRepository);
  });

  it("retorna la lista de mascotas del usuario", async () => {

    const pets = [makePet("Firulais"), makePet("Max")];
    vi.mocked(petRepository.findAllByUserId).mockResolvedValue(pets);


    const result = await useCase.execute(1);

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Firulais");
    expect(result[1]?.name).toBe("Max");
  });

  it("retorna un array vacío si el usuario no tiene mascotas", async () => {

    vi.mocked(petRepository.findAllByUserId).mockResolvedValue([]);

    const result = await useCase.execute(99);

    expect(result).toHaveLength(0);
  });

  it("propaga el error si el repositorio falla", async () => {

    vi.mocked(petRepository.findAllByUserId).mockRejectedValue(
      new Error("Connection lost")
    );

    await expect(useCase.execute(1)).rejects.toThrow("Connection lost");
  });
});
