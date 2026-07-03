import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaRefreshTokenRepository } from "../refresh-token.repository";
import { RefreshToken } from "@domain/entities/RefreshToken";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomBytes } from "crypto";

function makeExpiresAt(ms = 3600000): Date {
    return new Date(Date.now() + ms);
}

describe("PrismaRefreshTokenRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaRefreshTokenRepository;
    let testUserId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaRefreshTokenRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const user = await prisma.user.create({
            data: { email: "test@example.com", username: "testuser", password: "hashed" },
        });
        testUserId = user.user_id;
    });

    describe("save()", () => {
        it("guarda el refresh token en la base de datos", async () => {
            const tokenValue = randomBytes(32).toString("hex");
            const token = RefreshToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const count = await prisma.refreshToken.count({ where: { user_id: testUserId } });
            expect(count).toBe(1);
        });

        it("almacena el token hasheado (no en texto plano)", async () => {
            const tokenValue = randomBytes(32).toString("hex");
            const token = RefreshToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const raw = await prisma.refreshToken.findFirst({ where: { user_id: testUserId } });
            expect(raw!.token).not.toBe(tokenValue);
        });
    });

    describe("findByValue()", () => {
        it("retorna el token dado su valor en texto plano", async () => {
            const tokenValue = randomBytes(32).toString("hex");
            const token = RefreshToken.create(testUserId, tokenValue, makeExpiresAt());
            await repository.save(token);

            const found = await repository.findByValue(tokenValue);

            expect(found).not.toBeNull();
            expect(found!.userId).toBe(testUserId);
            expect(found!.isRevoked()).toBe(false);
        });

        it("retorna null cuando el valor no coincide", async () => {
            const found = await repository.findByValue(randomBytes(32).toString("hex"));
            expect(found).toBeNull();
        });
    });

    describe("revoke()", () => {
        it("marca el token como revocado", async () => {
            const tokenValue = randomBytes(32).toString("hex");
            const token = RefreshToken.create(testUserId, tokenValue, makeExpiresAt());
            await repository.save(token);

            const saved = await repository.findByValue(tokenValue);
            await repository.revoke(saved!.requireId(), new Date());

            const found = await repository.findByValue(tokenValue);
            expect(found!.isRevoked()).toBe(true);
            expect(found!.revokedAt).not.toBeNull();
        });
    });

    describe("revokeAllByUser()", () => {
        it("revoca todos los tokens activos del usuario", async () => {
            const token1Value = randomBytes(32).toString("hex");
            const token2Value = randomBytes(32).toString("hex");

            await repository.save(RefreshToken.create(testUserId, token1Value, makeExpiresAt()));
            await repository.save(RefreshToken.create(testUserId, token2Value, makeExpiresAt()));

            await repository.revokeAllByUser(testUserId, new Date());

            const token1 = await repository.findByValue(token1Value);
            const token2 = await repository.findByValue(token2Value);

            expect(token1!.isRevoked()).toBe(true);
            expect(token2!.isRevoked()).toBe(true);
        });

        it("no afecta tokens de otros usuarios", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            const token1Value = randomBytes(32).toString("hex");
            const token2Value = randomBytes(32).toString("hex");

            await repository.save(RefreshToken.create(testUserId, token1Value, makeExpiresAt()));
            await repository.save(RefreshToken.create(user2.user_id, token2Value, makeExpiresAt()));

            await repository.revokeAllByUser(testUserId, new Date());

            const token2 = await repository.findByValue(token2Value);
            expect(token2!.isRevoked()).toBe(false);
        });
    });
});
