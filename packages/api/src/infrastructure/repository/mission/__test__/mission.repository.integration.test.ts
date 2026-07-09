import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaMissionRepository } from "@infrastructure/repository/mission/mission.repository";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";

describe("PrismaMissionRepository (integración)", () => {
    let prisma: PrismaClient;
    let repository: PrismaMissionRepository;
    let testUserId: number;
    let testReportId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaMissionRepository(prisma);
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
    });

    it("guarda una misión y la recupera por publicId", async () => {
        const searchArea = SearchArea.create(-34.6037, -58.3816, 500);
        const mission = Mission.create({
            reportId: testReportId,
            searchArea,
            title: "Misión de búsqueda",
            description: "Ayúdanos a buscar"
        });

        const savedId = await repository.save(mission);
        expect(savedId).toBeDefined();

        const found = await repository.findByPublicId(mission.publicId);
        expect(found).not.toBeNull();
        expect(found!.title).toBe("Misión de búsqueda");
        expect(found!.reportId).toBe(testReportId);
        expect(found!.status).toBe(MissionStatus.OPEN);
    });

    it("encuentra misiones activas", async () => {
        const searchArea = SearchArea.create(-34.6037, -58.3816, 500);
        const mission1 = Mission.create({
            reportId: testReportId,
            searchArea,
            title: "Misión Activa 1",
            description: "Desc"
        });

        await repository.save(mission1);

        const activeMissions = await repository.findActive();
        expect(activeMissions.length).toBe(1);
        expect(activeMissions[0]!.title).toBe("Misión Activa 1");
    });

    it("encuentra una misión por reportId", async () => {
        const searchArea = SearchArea.create(-34.6037, -58.3816, 500);
        const mission = Mission.create({
            reportId: testReportId,
            searchArea,
            title: "Misión por Report",
            description: "Desc"
        });

        await repository.save(mission);

        const found = await repository.findByReportId(testReportId);
        expect(found).not.toBeNull();
        expect(found!.title).toBe("Misión por Report");
    });

    it("encuentra misiones unidas de un voluntario y maneja la unión/salida en update()", async () => {
        const searchArea = SearchArea.create(-34.6037, -58.3816, 500);
        const mission = Mission.create({
            reportId: testReportId,
            searchArea,
            title: "Misión Voluntario",
            description: "Desc"
        });

        const savedId = await repository.save(mission);

        const restored = Mission.restore({
            missionId: savedId,
            publicId: mission.publicId,
            reportId: mission.reportId,
            searchArea: mission.searchArea,
            title: mission.title,
            description: mission.description,
            status: mission.status,
            volunteerIds: [],
            createdAt: mission.createdAt,
            updatedAt: mission.updatedAt
        });


        restored.joinVolunteer(testUserId);
        await repository.update(restored);


        const joinedMissions = await repository.findByVolunteerId(testUserId);
        expect(joinedMissions.length).toBe(1);
        expect(joinedMissions[0]!.publicId).toBe(restored.publicId);
        expect(joinedMissions[0]!.volunteerIds).toContain(testUserId);


        restored.leaveVolunteer(testUserId);
        await repository.update(restored);

        const emptyMissions = await repository.findByVolunteerId(testUserId);
        expect(emptyMissions.length).toBe(0);
    });
});
