import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { CatalogResolver } from "../catalog-resolver";
import { AnimalType } from "@domain/shared/animal-type/animal-type";

describe("CatalogResolver", () => {
    let prisma: { color: { findFirst: ReturnType<typeof vi.fn> }; breed: { findFirst: ReturnType<typeof vi.fn> } };
    let resolver: CatalogResolver;

    beforeEach(() => {
        prisma = { color: { findFirst: vi.fn() }, breed: { findFirst: vi.fn() } };
        resolver = new CatalogResolver(prisma as unknown as PrismaClient);
    });

    describe("colorId", () => {
        it("resuelve el color por nombre", async () => {
            prisma.color.findFirst.mockResolvedValue({ color_id: 5, name: "Negro" });
            expect(await resolver.colorId("Negro")).toBe(5);
        });

        it("cae a 'Otro' si el color no está en el catálogo", async () => {
            prisma.color.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ color_id: 99, name: "Otro" });
            expect(await resolver.colorId("Fucsia")).toBe(99);
        });

        it("lanza si no hay color ni fallback 'Otro'", async () => {
            prisma.color.findFirst.mockResolvedValue(null);
            await expect(resolver.colorId("Fucsia")).rejects.toThrow();
        });
    });

    describe("breedId", () => {
        it("devuelve null si no hay nombre", async () => {
            expect(await resolver.breedId("", AnimalType.DOG)).toBeNull();
            expect(prisma.breed.findFirst).not.toHaveBeenCalled();
        });

        it("resuelve la raza por nombre y especie", async () => {
            prisma.breed.findFirst.mockResolvedValue({ breed_id: 3, name: "Labrador" });
            expect(await resolver.breedId("Labrador", AnimalType.DOG)).toBe(3);
        });

        it("devuelve null si la raza no está en el catálogo", async () => {
            prisma.breed.findFirst.mockResolvedValue(null);
            expect(await resolver.breedId("Raza inexistente", AnimalType.CAT)).toBeNull();
        });
    });
});
