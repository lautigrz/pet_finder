import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaNotificationPreferencesRepository } from "../notification-preferences.repository";
import { truncateAll } from "@pet-alert/shared/testing";

describe("PrismaNotificationPreferencesRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaNotificationPreferencesRepository;
    let userPublicId: string;
    let userId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaNotificationPreferencesRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const user = await prisma.user.create({
            data: { email: "test@example.com", username: "testuser", password: "hashed" },
        });
        userId = user.user_id;
        userPublicId = user.public_id;
    });

    describe("getOrCreateByUserPublicId()", () => {
        it("crea preferencias por defecto si el usuario no las tiene", async () => {
            const prefs = await repository.getOrCreateByUserPublicId(userPublicId);

            expect(prefs).toBeDefined();
            expect(prefs.userInternalId).toBe(userId);
            expect(prefs.notificationRadius).toBeGreaterThan(0);
            expect(typeof prefs.lostReportsEnabled).toBe("boolean");
            expect(typeof prefs.sightingReportsEnabled).toBe("boolean");
            expect(typeof prefs.matchesEnabled).toBe("boolean");
        });

        it("retorna las mismas preferencias si ya existen (idempotente)", async () => {
            const first = await repository.getOrCreateByUserPublicId(userPublicId);
            const second = await repository.getOrCreateByUserPublicId(userPublicId);

            expect(first.internalId).toBe(second.internalId);
        });

        it("crea preferencias con valores por defecto habilitados", async () => {
            const prefs = await repository.getOrCreateByUserPublicId(userPublicId);

            expect(prefs.lostReportsEnabled).toBe(true);
            expect(prefs.sightingReportsEnabled).toBe(true);
            expect(prefs.matchesEnabled).toBe(true);
            expect(prefs.mutedUntil).toBeNull();
        });
    });

    describe("updateByUserPublicId()", () => {
        it("actualiza el radio de notificación", async () => {
            await repository.getOrCreateByUserPublicId(userPublicId);

            const updated = await repository.updateByUserPublicId(userPublicId, {
                notificationRadius: 10,
            });

            expect(updated.notificationRadius).toBe(10);
        });

        it("actualiza los flags de notificación", async () => {
            await repository.getOrCreateByUserPublicId(userPublicId);

            const updated = await repository.updateByUserPublicId(userPublicId, {
                lostReportsEnabled: false,
                sightingReportsEnabled: false,
                matchesEnabled: false,
            });

            expect(updated.lostReportsEnabled).toBe(false);
            expect(updated.sightingReportsEnabled).toBe(false);
            expect(updated.matchesEnabled).toBe(false);
        });

        it("actualiza la fecha de silenciado (mutedUntil)", async () => {
            await repository.getOrCreateByUserPublicId(userPublicId);
            const mutedUntil = new Date(Date.now() + 3600000);

            const updated = await repository.updateByUserPublicId(userPublicId, {
                mutedUntil,
            });

            expect(updated.mutedUntil).not.toBeNull();
            expect(updated.mutedUntil!.getTime()).toBeCloseTo(mutedUntil.getTime(), -3);
        });

        it("puede desactivar el silenciado pasando null", async () => {
            await repository.getOrCreateByUserPublicId(userPublicId);
            const mutedUntil = new Date(Date.now() + 3600000);

            await repository.updateByUserPublicId(userPublicId, { mutedUntil });
            const updated = await repository.updateByUserPublicId(userPublicId, { mutedUntil: null });

            expect(updated.mutedUntil).toBeNull();
        });

        it("actualiza parcialmente sin afectar otros campos", async () => {
            const initial = await repository.getOrCreateByUserPublicId(userPublicId);

            const updated = await repository.updateByUserPublicId(userPublicId, {
                notificationRadius: 20,
            });

            expect(updated.lostReportsEnabled).toBe(initial.lostReportsEnabled);
            expect(updated.sightingReportsEnabled).toBe(initial.sightingReportsEnabled);
            expect(updated.matchesEnabled).toBe(initial.matchesEnabled);
            expect(updated.notificationRadius).toBe(20);
        });
    });
});
