import prisma from "@infrastructure/prisma/prisma.client";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaPetRepository } from "../prisma-pet.repository";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

describe("PrismaPetRepository (integration)", () => {
    let repository: PrismaPetRepository;

    beforeAll(async () => {
        await prisma.$connect();
        repository = new PrismaPetRepository();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);
    });

    describe("updateImageEmbedding()", () => {
        it("actualiza el embedding de la foto de la mascota correctamente", async () => {
            const user = await prisma.user.create({
                data: { email: "owner@example.com", username: "owner", password: "hashed", public_id: randomUUID() },
            });

            const pet = await prisma.pet.create({
                data: {
                    user_id: user.user_id,
                    pet_name: "Firulais",
                    animal_type_id: 1,
                    breed_id: 1,
                    color_id: 1,
                    gender_id: 1,
                    size_id: 1,
                    public_id: randomUUID(),
                    created_at: new Date(),
                },
            });

            const petImage = await prisma.petImage.create({
                data: {
                    cloudinaryId: "cloudinary-id-abc",
                    petId: pet.pet_id,
                    photoUrl: "https://example.com/photo.jpg",
                },
            });

            const embedding = Array(384).fill(0.25);
            await repository.updateImageEmbedding(petImage.imageId, embedding);

            const rows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
                SELECT embedding_photo::text AS embedding 
                FROM pet_images 
                WHERE image_id = ${petImage.imageId}
            `;

            expect(rows).toHaveLength(1);
            expect(rows[0]!.embedding).not.toBeNull();
            expect(rows[0]!.embedding).toContain("0.25");
        });
    });
});
