import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetImage } from "@domain/pet/value-objects/image.vo";

describe("PrismaPetRepository (integration)", () => {
    let prisma: PrismaClient;
    let repository: PrismaPetRepository;
    let testUserId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaPetRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const user = await prisma.user.create({
            data: {
                email: "test-user@example.com",
                username: "testuser",
                password: "hashed-password",
            },
        });
        testUserId = user.user_id;
    });

    it("guarda una mascota y la recupera por id", async () => {
        const pet = Pet.create({
            userId: testUserId,
            name: "Firulais",
            animalType: "DOG",
            genderType: "MALE",
            sizeType: "MEDIUM",
            color: "Negro",
            hasIdCollar: true,
            isVaccinated: false,
            breed: "Mestizo",
            petImage: [
                PetImage.create({
                    cloudinaryId: "abc123",
                    photoUrl: "https://example.com/photo.jpg",
                }),
            ],
        });

        await repository.save(pet);

        const saved = await prisma.pet.findFirst({
            where: { user_id: testUserId },
        });
        expect(saved).not.toBeNull();

        const found = await repository.findById(saved!.pet_id);

        expect(found).not.toBeNull();
        expect(found!.name).toBe("Firulais");
        expect(found!.userId).toBe(testUserId);
        expect(found!.color).toBe("Negro");
        expect(found!.breed).toBe("Mestizo");
        expect(found!.images).toHaveLength(1);
    });

    it("retorna null cuando el id no existe", async () => {
        const found = await repository.findById(999999);
        expect(found).toBeNull();
    });

    it("encuentra una mascota por publicId", async () => {
        const pet = Pet.create({
            userId: testUserId,
            name: "Michi",
            animalType: "CAT",
            genderType: "FEMALE",
            sizeType: "SMALL",
            color: "Blanco",
            hasIdCollar: false,
            isVaccinated: true,
            breed: "Siamés",
            petImage: [
                PetImage.create({
                    cloudinaryId: "xyz789",
                    photoUrl: "https://example.com/michi.jpg",
                }),
            ],
        });

        await repository.save(pet);

        const found = await repository.findByPublicId(pet.publicId);

        expect(found).not.toBeNull();
        expect(found!.name).toBe("Michi");
    });

    it("retorna todas las mascotas de un usuario", async () => {
        const pet1 = Pet.create({
            userId: testUserId,
            name: "Pet1",
            animalType: "DOG",
            genderType: "MALE",
            sizeType: "LARGE",
            color: "Marrón",
            hasIdCollar: true,
            isVaccinated: true,
            breed: "Labrador",
            petImage: [PetImage.create({ cloudinaryId: "id1", photoUrl: "url1" })],
        });

        const pet2 = Pet.create({
            userId: testUserId,
            name: "Pet2",
            animalType: "CAT",
            genderType: "FEMALE",
            sizeType: "SMALL",
            color: "Gris",
            hasIdCollar: false,
            isVaccinated: false,
            breed: "Persa",
            petImage: [PetImage.create({ cloudinaryId: "id2", photoUrl: "url2" })],
        });

        await repository.save(pet1);
        await repository.save(pet2);

        const pets = await repository.findAllByUserId(testUserId);

        expect(pets).toHaveLength(2);
        expect(pets.map((p) => p.name).sort()).toEqual(["Pet1", "Pet2"]);
    });
});