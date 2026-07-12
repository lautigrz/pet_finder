import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaMissionCoverageRepository } from "@infrastructure/repository/mission/mission-coverage.repository";

describe("PrismaMissionCoverageRepository (integración)", () => {
    let prisma: PrismaClient;
    let repository: PrismaMissionCoverageRepository;
    let testUserId: number;
    let testMissionId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaMissionCoverageRepository(prisma);
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

        const mission = await prisma.mission.create({
            data: {
                report_id: report.report_id,
                latitude: 10,
                longitude: 20,
                radius: 500,
                title: "Test Mission",
                description: "Test description",
                mission_status_id: 1
            }
        });
        testMissionId = mission.mission_id;
    });

    it("guarda cobertura y la recupera", async () => {
        const cells = ["dr5ru718", "dr5ru719"];
        await repository.saveCoverage(testMissionId, testUserId, cells);

        const result = await repository.getCoverage(testMissionId);
        expect(result.cells).toContain("dr5ru718");
        expect(result.cells).toContain("dr5ru719");
        expect(result.cells.length).toBe(2);
        expect(result.lastSyncTimestamp).toBeInstanceOf(Date);
    });

    it("filtra cobertura por since", async () => {
        const cells1 = ["dr5ru718"];
        await repository.saveCoverage(testMissionId, testUserId, cells1);

        const beforeSecondSave = new Date();
        // Wait a small bit or mock Date
        await new Promise(resolve => setTimeout(resolve, 50));

        const cells2 = ["dr5ru719"];
        await repository.saveCoverage(testMissionId, testUserId, cells2);

        const resultAll = await repository.getCoverage(testMissionId);
        expect(resultAll.cells.length).toBe(2);

        const resultSince = await repository.getCoverage(testMissionId, beforeSecondSave);
        expect(resultSince.cells).toContain("dr5ru719");
        expect(resultSince.cells).not.toContain("dr5ru718");
        expect(resultSince.cells.length).toBe(1);
    });
});
