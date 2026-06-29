import { describe, it, expect } from "vitest";
import { PetMapper } from "../pet-mapper";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";

const makeRestoredPet = (overrides?: Partial<Parameters<typeof Pet.restore>[0]>) =>
  Pet.restore({
    idPet: 1,
    publicId: "pet-pub-uuid",
    userId: 1,
    name: "Firulais",
    animalType: AnimalType.DOG,
    genderType: GenderType.MALE,
    sizeType: SizeType.MEDIUM,
    color: "brown",
    hasIdCollar: true,
    isVaccinated: true,
    breed: "Labrador",
    petImage: [PetImage.create({
      cloudinaryId: "fake-id",
      photoUrl: "https://fake.com/img.jpg",
    })],
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: null,
    ...overrides,
  });

describe("PetMapper.toOutput", () => {
  it("mapea correctamente un Pet a PetOutput", () => {
    const pet = makeRestoredPet();
    const output = PetMapper.toOutput(pet);

    expect(output.publicId).toBe("pet-pub-uuid");
    expect(output.name).toBe("Firulais");
    expect(output.animalType).toBe(AnimalType.DOG);
    expect(output.genderType).toBe(GenderType.MALE);
    expect(output.sizeType).toBe(SizeType.MEDIUM);
    expect(output.color).toBe("brown");
    expect(output.hasIdCollar).toBe(true);
    expect(output.breed).toBe("Labrador");
    expect(output.createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(output.updatedAt).toBeNull();
  });

  it("no expone el cloudinaryId de las imágenes, solo la photoUrl", () => {
    const img = PetImage.create({
      cloudinaryId: "pets/secret-id",
      photoUrl: "https://res.cloudinary.com/demo/pets/img.jpg",
    });
    const pet = makeRestoredPet({ petImage: [img] });
    const output = PetMapper.toOutput(pet);

    expect(output.images).toHaveLength(1);
    expect(output.images[0]).toEqual({ url: "https://res.cloudinary.com/demo/pets/img.jpg" });
    expect(output.images[0]).not.toHaveProperty("cloudinaryId");
  });

  it("mapea updatedAt como string ISO si está presente", () => {
    const updatedAt = new Date("2024-06-15T12:00:00.000Z");
    const pet = makeRestoredPet({ updatedAt });
    const output = PetMapper.toOutput(pet);

    expect(output.updatedAt).toBe("2024-06-15T12:00:00.000Z");
  });
  it("mapea múltiples imágenes correctamente", () => {
    const images = [
      PetImage.create({ cloudinaryId: "id1", photoUrl: "https://url.com/1.jpg" }),
      PetImage.create({ cloudinaryId: "id2", photoUrl: "https://url.com/2.jpg" }),
    ];
    const pet = makeRestoredPet({ petImage: images });
    const output = PetMapper.toOutput(pet);

    expect(output.images).toHaveLength(2);
    expect(output.images[0]?.url).toBe("https://url.com/1.jpg");
    expect(output.images[1]?.url).toBe("https://url.com/2.jpg");
  });
});
