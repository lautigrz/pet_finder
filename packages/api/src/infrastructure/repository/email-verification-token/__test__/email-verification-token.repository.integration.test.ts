import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaEmailVerificationTokenRepository } from "../email-verification-token.repository";
import { EmailVerificationToken } from "@domain/entities/EmailVerificationToken";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomBytes } from "crypto";

function makeExpiresAt(ms = 3600000): Date {
    return new Date(Date.now() + ms);
}

function makeTokenValue(): string {
    return randomBytes(32).toString("hex");
}

describe("PrismaEmailVerificationTokenRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaEmailVerificationTokenRepository;
    let testUserId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaEmailVerificationTokenRepository(prisma);
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
        it("guarda el token de verificación en la base de datos", async () => {
            const tokenValue = makeTokenValue();
            const token = EmailVerificationToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const count = await prisma.emailVerificationToken.count({ where: { user_id: testUserId } });
            expect(count).toBe(1);
        });

        it("persiste el token en texto plano (no hasheado)", async () => {
            const tokenValue = makeTokenValue();
            const token = EmailVerificationToken.create(testUserId, tokenValue, makeExpiresAt());

            await repository.save(token);

            const raw = await prisma.emailVerificationToken.findFirst({ where: { user_id: testUserId } });
            expect(raw!.token).toBe(tokenValue);
        });
    });

    describe("findByValue()", () => {
        it("retorna el token dado su valor", async () => {
            const tokenValue = makeTokenValue();
            const token = EmailVerificationToken.create(testUserId, tokenValue, makeExpiresAt());
            await repository.save(token);

            const found = await repository.findByValue(tokenValue);

            expect(found).not.toBeNull();
            expect(found!.userId).toBe(testUserId);
            expect(found!.value).toBe(tokenValue);
            expect(found!.isUsed()).toBe(false);
        });

        it("retorna null cuando el valor no existe", async () => {
            const found = await repository.findByValue(makeTokenValue());
            expect(found).toBeNull();
        });
    });

    describe("markAsUsed()", () => {
        it("marca el token como usado", async () => {
            const tokenValue = makeTokenValue();
            const token = EmailVerificationToken.create(testUserId, tokenValue, makeExpiresAt());
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
