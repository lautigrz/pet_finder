import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaUserRepository } from "../user.repository";
import { User } from "@domain/entities/User";
import { EmailAddress } from "@domain/shared/email/email-address.vo";
import { truncateAll } from "@pet-alert/shared/testing";

const BCRYPT_HASH = "$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV012345";
const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";
const NON_EXISTENT_ID = 999999;

describe("PrismaUserRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaUserRepository;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaUserRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);
    });

    function makeUser(email = "test@example.com", username = "testuser"): User {
        return User.create(
            EmailAddress.create(email),
            username,
            BCRYPT_HASH,
        );
    }

    describe("save()", () => {
        it("guarda un usuario y retorna la entidad con su internalId", async () => {
            const user = makeUser();
            const saved = await repository.save(user);

            expect(saved.internalId).not.toBeNull();
            expect(saved.email).toBe("test@example.com");
            expect(saved.username).toBe("testuser");
            expect(saved.isVerified).toBe(false);
        });
    });

    describe("findByEmail()", () => {
        it("retorna el usuario por email", async () => {
            const user = makeUser();
            await repository.save(user);

            const found = await repository.findByEmail("test@example.com");

            expect(found).not.toBeNull();
            expect(found!.email).toBe("test@example.com");
        });

        it("retorna null cuando el email no existe", async () => {
            const found = await repository.findByEmail("noexiste@example.com");
            expect(found).toBeNull();
        });
    });

    describe("findById()", () => {
        it("retorna el usuario por id interno", async () => {
            const saved = await repository.save(makeUser());

            const found = await repository.findById(saved.internalId!);

            expect(found).not.toBeNull();
            expect(found!.internalId).toBe(saved.internalId);
        });

        it("retorna null cuando el id no existe", async () => {
            const found = await repository.findById(NON_EXISTENT_ID);
            expect(found).toBeNull();
        });
    });

    describe("findByPublicId()", () => {
        it("retorna el usuario por publicId", async () => {
            const saved = await repository.save(makeUser());

            const found = await repository.findByPublicId(saved.id);

            expect(found).not.toBeNull();
            expect(found!.id).toBe(saved.id);
        });

        it("retorna null cuando el publicId no existe", async () => {
            const found = await repository.findByPublicId(NON_EXISTENT_UUID);
            expect(found).toBeNull();
        });
    });

    describe("markVerified()", () => {
        it("marca al usuario como verificado", async () => {
            const saved = await repository.save(makeUser());
            expect(saved.isVerified).toBe(false);

            await repository.markVerified(saved.internalId!);

            const found = await repository.findById(saved.internalId!);
            expect(found!.isVerified).toBe(true);
        });
    });

    describe("updateProfile()", () => {
        it("actualiza los campos del perfil del usuario", async () => {
            const saved = await repository.save(makeUser());

            const updated = await repository.updateProfile(saved.id, {
                name: "Lautaro",
                lastname: "García",
                username: "nuevouser",
                photoUrl: "https://example.com/photo.jpg",
            });

            expect(updated.name).toBe("Lautaro");
            expect(updated.lastname).toBe("García");
            expect(updated.username).toBe("nuevouser");
            expect(updated.photoUrl).toBe("https://example.com/photo.jpg");
        });
    });

    describe("updatePassword()", () => {
        it("actualiza la contraseña del usuario", async () => {
            const saved = await repository.save(makeUser());
            const newHash = "$2b$10$ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";

            await repository.updatePassword(saved.internalId!, newHash);

            const found = await repository.findById(saved.internalId!);
            expect(found!.passwordHash).toBe(newHash);
        });
    });

    describe("findByIds()", () => {
        it("retorna los usuarios cuyos ids coinciden", async () => {
            const user1 = await repository.save(makeUser("u1@example.com", "userone"));
            const user2 = await repository.save(makeUser("u2@example.com", "usertwo"));

            const result = await repository.findByIds([user1.internalId!, user2.internalId!]);

            expect(result).toHaveLength(2);
            const usernames = result.map((u) => u.username).sort();
            expect(usernames).toEqual(["userone", "usertwo"]);
        });

        it("retorna lista vacía si no hay ids coincidentes", async () => {
            const result = await repository.findByIds([NON_EXISTENT_ID]);
            expect(result).toHaveLength(0);
        });
    });

    describe("deleteById()", () => {
        it("elimina al usuario y sus tokens de verificación", async () => {
            const saved = await repository.save(makeUser());

            await prisma.emailVerificationToken.create({
                data: {
                    user_id: saved.internalId!,
                    token: "sometoken",
                    expires_at: new Date(Date.now() + 86400000),
                },
            });

            await repository.deleteById(saved.internalId!);

            const found = await repository.findById(saved.internalId!);
            expect(found).toBeNull();

            const tokens = await prisma.emailVerificationToken.findMany({
                where: { user_id: saved.internalId! },
            });
            expect(tokens).toHaveLength(0);
        });
    });

    describe("getProfileStatsByPublicId()", () => {
        it("retorna estadísticas agregadas del perfil", async () => {
            const saved = await repository.save(makeUser());

            await prisma.reportType.createMany({
                data: [{ report_type_id: 1, name: "LOST" }],
                skipDuplicates: true,
            });

            await prisma.reportStatus.createMany({
                data: [{ report_status_id: 1, name: "ACTIVE" }],
                skipDuplicates: true,
            });

            await prisma.report.createMany({
                data: [
                    {
                        public_id: "11111111-1111-1111-1111-111111111111",
                        user_id: saved.internalId!,
                        report_type_id: 1,
                        report_status_id: 1,
                        occurred_at: new Date(),
                        location_lat: -34.6,
                        location_lng: -58.4,
                        created_at: new Date(),
                        resolved: false,
                    },
                    {
                        public_id: "22222222-2222-2222-2222-222222222222",
                        user_id: saved.internalId!,
                        report_type_id: 1,
                        report_status_id: 1,
                        occurred_at: new Date(),
                        location_lat: -34.6,
                        location_lng: -58.4,
                        created_at: new Date(),
                        resolved: true,
                        resolved_at: new Date(),
                    },
                ],
            });

            const stats = await repository.getProfileStatsByPublicId(saved.id);

            expect(stats).toEqual({
                reportsCreated: 2,
                successfulReturns: 1,
                activeDays: expect.any(Number),
                petsHelped: 0,
            });

            expect(stats.activeDays).toBeGreaterThanOrEqual(1);
        });

        it("retorna estadísticas en cero si el usuario no existe", async () => {
            const stats = await repository.getProfileStatsByPublicId(NON_EXISTENT_UUID);

            expect(stats).toEqual({
                reportsCreated: 0,
                successfulReturns: 0,
                activeDays: 0,
                petsHelped: 0,
            });
        });
    });
});
