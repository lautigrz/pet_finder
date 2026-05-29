import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";

const validDto = {
  userId: 1,
  name: "Firulais",
  animalType: AnimalType.DOG,
  genderType: GenderType.MALE,
  sizeType: SizeType.MEDIUM,
  color: "brown",
  hasIdCollar: true,
  breed: "Labrador",
};

describe("CreatePetUseCase", () => {
  let petRepository: PetRepository;
  let useCase: CreatePetUseCase;

  beforeEach(() => {
    petRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByPublicId: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      delete: vi.fn(),
    } as unknown as PetRepository;

    useCase = new CreatePetUseCase(petRepository);
  });

  it("guarda la mascota y retorna un publicId de tipo UUID", async () => {

    const result = await useCase.execute(validDto);


    expect(petRepository.save).toHaveBeenCalledOnce();
    expect(result.publicId).toBeDefined();
    expect(result.publicId).toHaveLength(36);
  });

  it("propaga el error si el repositorio falla", async () => {

    vi.mocked(petRepository.save).mockRejectedValue(new Error("DB error"));


    await expect(useCase.execute(validDto)).rejects.toThrow("DB error");
  });

  it("llama al repositorio con la instancia de Pet creada", async () => {

    await useCase.execute(validDto);


    const savedPet = vi.mocked(petRepository.save).mock.calls[0]?.[0];
    expect(savedPet?.name).toBe("Firulais");
    expect(savedPet?.userId).toBe(1);
    expect(savedPet?.animalType).toBe(AnimalType.DOG);
  });
});
