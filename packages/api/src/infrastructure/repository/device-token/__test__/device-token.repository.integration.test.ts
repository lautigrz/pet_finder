import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaDeviceTokenRepository } from "../device-token.repository";
import { truncateAll } from "@pet-alert/shared/testing";

describe("PrismaDeviceTokenRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaDeviceTokenRepository;
    let userPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaDeviceTokenRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const user = await prisma.user.create({
            data: { email: "test@example.com", username: "testuser", password: "hashed" },
        });
        userPublicId = user.public_id;
    });

    describe("registerForUser()", () => {
        it("registra un device token para un usuario", async () => {
            await repository.registerForUser(userPublicId, "fcm-token-123");

            const tokens = await repository.findTokensByUser(userPublicId);
            expect(tokens).toContain("fcm-token-123");
        });

        it("actualiza el usuario cuando el token ya existía (upsert)", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            await repository.registerForUser(userPublicId, "fcm-token-shared");
            await repository.registerForUser(user2.public_id, "fcm-token-shared");

            const tokensUser1 = await repository.findTokensByUser(userPublicId);
            const tokensUser2 = await repository.findTokensByUser(user2.public_id);

            expect(tokensUser1).not.toContain("fcm-token-shared");
            expect(tokensUser2).toContain("fcm-token-shared");
        });

        it("permite registrar múltiples tokens para un mismo usuario", async () => {
            await repository.registerForUser(userPublicId, "token-a");
            await repository.registerForUser(userPublicId, "token-b");

            const tokens = await repository.findTokensByUser(userPublicId);
            expect(tokens).toContain("token-a");
            expect(tokens).toContain("token-b");
        });
    });

    describe("removeForUser()", () => {
        it("elimina el device token de un usuario", async () => {
            await repository.registerForUser(userPublicId, "fcm-token-to-remove");

            await repository.removeForUser(userPublicId, "fcm-token-to-remove");

            const tokens = await repository.findTokensByUser(userPublicId);
            expect(tokens).not.toContain("fcm-token-to-remove");
        });

        it("no elimina tokens de otros usuarios con el mismo token", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            await repository.registerForUser(user2.public_id, "shared-token");
            await repository.removeForUser(userPublicId, "shared-token");

            const tokensUser2 = await repository.findTokensByUser(user2.public_id);
            expect(tokensUser2).toContain("shared-token");
        });
    });

    describe("findTokensByUser()", () => {
        it("retorna lista vacía cuando el usuario no tiene tokens", async () => {
            const tokens = await repository.findTokensByUser(userPublicId);
            expect(tokens).toHaveLength(0);
        });

        it("retorna todos los tokens del usuario", async () => {
            await repository.registerForUser(userPublicId, "token-1");
            await repository.registerForUser(userPublicId, "token-2");
            await repository.registerForUser(userPublicId, "token-3");

            const tokens = await repository.findTokensByUser(userPublicId);
            expect(tokens).toHaveLength(3);
            expect(tokens.sort()).toEqual(["token-1", "token-2", "token-3"]);
        });
    });

    describe("deleteByTokens()", () => {
        it("elimina los tokens indicados independientemente del usuario", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            await repository.registerForUser(userPublicId, "del-token-1");
            await repository.registerForUser(user2.public_id, "del-token-2");
            await repository.registerForUser(userPublicId, "keep-token");

            await repository.deleteByTokens(["del-token-1", "del-token-2"]);

            const tokensUser1 = await repository.findTokensByUser(userPublicId);
            const tokensUser2 = await repository.findTokensByUser(user2.public_id);

            expect(tokensUser1).not.toContain("del-token-1");
            expect(tokensUser1).toContain("keep-token");
            expect(tokensUser2).not.toContain("del-token-2");
        });

        it("no hace nada si los tokens no existen", async () => {
            await expect(repository.deleteByTokens(["non-existent-token"])).resolves.not.toThrow();
        });
    });
});
