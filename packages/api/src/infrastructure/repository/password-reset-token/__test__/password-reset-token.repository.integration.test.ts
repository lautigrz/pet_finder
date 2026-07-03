import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaPasswordResetTokenRepository } from "../password-reset-token.repository";
import { PasswordResetToken } from "@domain/entities/PasswordResetToken";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomBytes } from "crypto";

function makeExpiresAt(ms = 3600000): Date {
    return new Date(Date.now() + ms);
}

function makeTokenValue(): string {
    return randomBytes(32).toString("hex");
}

describe("PrismaPasswordResetTokenRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaPasswordResetTokenRepository;
    let testUserId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaPasswordResetTokenRepository(prisma);
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
        it("guarda el token de reset de contraseña en la base de datos", async () => {
            const tokenValue = makeTokenValue();
            const token = PasswordResetToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const count = await prisma.passwordResetToken.count({ where: { user_id: testUserId } });
            expect(count).toBe(1);
        });

        it("almacena el token hasheado (no en texto plano)", async () => {
            const tokenValue = makeTokenValue();
            const token = PasswordResetToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const raw = await prisma.passwordResetToken.findFirst({ where: { user_id: testUserId } });
            expect(raw!.token).not.toBe(tokenValue);
        });
    });

    describe("findByValue()", () => {
        it("retorna el token dado su valor en texto plano", async () => {
            const tokenValue = makeTokenValue();
            const token = PasswordResetToken.create(testUserId, tokenValue, makeExpiresAt());
            await repository.save(token);

            const found = await repository.findByValue(tokenValue);

            expect(found).not.toBeNull();
            expect(found!.userId).toBe(testUserId);
            expect(found!.isUsed()).toBe(false);
        });

        it("retorna null cuando el valor no coincide", async () => {
            const found = await repository.findByValue(makeTokenValue());
            expect(found).toBeNull();
        });
    });

    describe("markAsUsed()", () => {
        it("marca el token como usado", async () => {
            const tokenValue = makeTokenValue();
            const token = PasswordResetToken.create(testUserId, tokenValue, makeExpiresAt());
            await repository.save(token);

            const saved = await repository.findByValue(tokenValue);
            expect(saved!.isUsed()).toBe(false);

            await repository.markAsUsed(saved!.requireId(), new Date());

            const found = await repository.findByValue(tokenValue);
            expect(found!.isUsed()).toBe(true);
            expect(found!.usedAt).not.toBeNull();
        });
    });
});
