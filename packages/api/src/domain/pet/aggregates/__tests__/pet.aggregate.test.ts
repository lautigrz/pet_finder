import { describe, it, expect } from "vitest";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";
import { InvalidPetNameError } from "@domain/errors/InvalidPetNameError";
import { PetImage } from "@domain/pet/value-objects/image.vo";

const validParams = {
  userId: 1,
  name: "Firulais",
  animalType: AnimalType.DOG,
  genderType: GenderType.MALE,
  sizeType: SizeType.MEDIUM,
  color: "brown",
  hasIdCollar: true,
  breed: "Labrador",
};

describe("Pet.create", () => {
  it("crea una mascota con publicId generado y idPet null", () => {

    const pet = Pet.create(validParams);


    expect(pet.idPet).toBeNull();
    expect(pet.publicId).toBeDefined();
    expect(pet.publicId).toHaveLength(36);
    expect(pet.userId).toBe(1);
    expect(pet.name).toBe("Firulais");
    expect(pet.animalType).toBe(AnimalType.DOG);
    expect(pet.genderType).toBe(GenderType.MALE);
    expect(pet.sizeType).toBe(SizeType.MEDIUM);
    expect(pet.color).toBe("brown");
    expect(pet.hasIdCollar).toBe(true);
    expect(pet.breed).toBe("Labrador");
    expect(pet.createdAt).toBeInstanceOf(Date);
    expect(pet.updatedAt).toBeNull();
  });

  it("lanza InvalidPetNameError si el nombre tiene menos de 2 caracteres", () => {
    expect(() => Pet.create({ ...validParams, name: "A" })).toThrow(
      InvalidPetNameError
    );
  });

  it("lanza InvalidPetNameError si el nombre está vacío", () => {
    expect(() => Pet.create({ ...validParams, name: "" })).toThrow(
      InvalidPetNameError
    );
  });

  it("acepta un nombre con exactamente 2 caracteres", () => {
    const pet = Pet.create({ ...validParams, name: "Bo" });
    expect(pet.name).toBe("Bo");
  });
});

describe("Pet.restore", () => {
  it("restaura una mascota con todos sus valores originales", () => {

    const createdAt = new Date("2024-01-01");
    const updatedAt = new Date("2024-06-01");


    const pet = Pet.restore({
      idPet: 42,
      publicId: "uuid-test-1234",
      userId: 7,
      name: "Max",
      animalType: AnimalType.CAT,
      genderType: GenderType.FEMALE,
      sizeType: SizeType.SMALL,
      color: "white",
      hasIdCollar: false,
      breed: "Siamese",
      createdAt,
      updatedAt,
    });

    expect(pet.idPet).toBe(42);
    expect(pet.publicId).toBe("uuid-test-1234");
    expect(pet.userId).toBe(7);
    expect(pet.name).toBe("Max");
    expect(pet.animalType).toBe(AnimalType.CAT);
    expect(pet.genderType).toBe(GenderType.FEMALE);
    expect(pet.sizeType).toBe(SizeType.SMALL);
    expect(pet.color).toBe("white");
    expect(pet.hasIdCollar).toBe(false);
    expect(pet.breed).toBe("Siamese");
    expect(pet.createdAt).toBe(createdAt);
    expect(pet.updatedAt).toBe(updatedAt);
  });

  it("restaura con updatedAt null cuando no se pasa", () => {
    const pet = Pet.restore({
      idPet: 1,
      publicId: "uuid-abc",
      userId: 1,
      name: "Luna",
      animalType: AnimalType.DOG,
      genderType: GenderType.FEMALE,
      sizeType: SizeType.LARGE,
      color: "black",
      hasIdCollar: false,
      breed: "Poodle",
      createdAt: new Date(),
      updatedAt: null,
    });

    expect(pet.updatedAt).toBeNull();
  });
});

describe("Pet.rename", () => {
  it("cambia el nombre y actualiza updatedAt", () => {

    const pet = Pet.create(validParams);
    pet.rename("Rex");


    expect(pet.name).toBe("Rex");
    expect(pet.updatedAt).toBeInstanceOf(Date);
  });

  it("lanza InvalidPetNameError si el nuevo nombre tiene menos de 2 caracteres", () => {
    const pet = Pet.create(validParams);
    expect(() => pet.rename("X")).toThrow(InvalidPetNameError);
  });
});

describe("Pet.updateCollarStatus", () => {
  it("actualiza el collar y registra updatedAt", () => {

    const pet = Pet.create({ ...validParams, hasIdCollar: false });

    pet.updateCollarStatus(true);

    expect(pet.hasIdCollar).toBe(true);
    expect(pet.updatedAt).toBeInstanceOf(Date);
  });
});

describe("Pet.updateColor", () => {
  it("actualiza el color y registra updatedAt", () => {

    const pet = Pet.create({ ...validParams, color: "brown" });

    pet.updateColor("golden");

    expect(pet.color).toBe("golden");
    expect(pet.updatedAt).toBeInstanceOf(Date);
  });
});

describe("Pet — imágenes", () => {
  it("create sin petImage resulta en imágenes vacías por defecto del DTO", () => {
    const pet = Pet.create({ ...validParams, petImage: [] });
    expect(pet.images).toHaveLength(0);
  });

  it("restore preserva las imágenes del pet", () => {
    const img1 = PetImage.create({ cloudinaryId: "pets/abc", photoUrl: "https://url.com/img.jpg" });

    const pet = Pet.restore({
      idPet: 1,
      publicId: "uuid-abc",
      userId: 1,
      name: "Milo",
      animalType: AnimalType.DOG,
      genderType: GenderType.MALE,
      sizeType: SizeType.SMALL,
      color: "white",
      hasIdCollar: false,
      breed: "Poodle",
      petImage: [img1],
      createdAt: new Date(),
    });

    expect(pet.images).toHaveLength(1);
    expect(pet.images[0]?.cloudinaryId).toBe("pets/abc");
    expect(pet.images[0]?.photoUrl).toBe("https://url.com/img.jpg");
  });
});

