import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaMissionUpdateRepository } from "@infrastructure/repository/mission/mission-update.repository";
import { MissionUpdate } from "@domain/mission/MissionUpdate";

describe("PrismaMissionUpdateRepository (integración)", () => {
    let prisma: PrismaClient;
    let repository: PrismaMissionUpdateRepository;
    let testUserId: number;
    let testReportId: number;
    let testMissionId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaMissionUpdateRepository(prisma);
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

        const report = await prisma.report.create({
            data: {
                public_id: crypto.randomUUID(),
                user_id: testUserId,
                report_type_id: 2, // SIGHTING
                report_status_id: 1, // ACTIVE
                description: "Test description",
                occurred_at: new Date(),
                location_lat: 10,
                location_lng: 20,
                location_address: "Test address",
                created_at: new Date(),
            }
        });
        testReportId = report.report_id;

        const mission = await prisma.mission.create({
            data: {
                public_id: crypto.randomUUID(),
                report_id: testReportId,
                latitude: -34.6037,
                longitude: -58.3816,
                radius: 500,
                title: "Misión Test",
                description: "Desc",
                mission_status_id: 1
            }
        });
        testMissionId = mission.mission_id;
    });

    it("guarda una actualización de misión y la recupera por id de misión", async () => {
        const update = MissionUpdate.create({
            missionId: testMissionId,
            userId: testUserId,
            comment: "Vi un rastro del perrito",
            photoUrl: "https://example.com/rastro.jpg"
        });

        const savedId = await repository.save(update);
        expect(savedId).toBeDefined();

        const updates = await repository.findByMissionId(testMissionId);
        expect(updates.length).toBe(1);
        expect(updates[0]!.comment).toBe("Vi un rastro del perrito");
        expect(updates[0]!.photoUrl).toBe("https://example.com/rastro.jpg");
        expect(updates[0]!.userId).toBe(testUserId);
        expect(updates[0]!.missionId).toBe(testMissionId);
    });

    it("recupera las actualizaciones realizadas por un usuario específico", async () => {
        const update = MissionUpdate.create({
            missionId: testMissionId,
            userId: testUserId,
            comment: "Comentario usuario",
            photoUrl: null
        });

        await repository.save(update);

        const results = await repository.findByUser(testUserId);
        expect(results.length).toBe(1);
        expect(results[0]!.comment).toBe("Comentario usuario");
        expect(results[0]!.mission).toBeDefined();
        expect(results[0]!.mission.report).toBeDefined();
    });
});
