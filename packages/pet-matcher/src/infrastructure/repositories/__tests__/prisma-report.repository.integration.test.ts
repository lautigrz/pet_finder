import prisma from "@infrastructure/prisma/prisma.client";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaReportRepository } from "../prisma-report.repository";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

describe("PrismaReportRepository (integration)", () => {
    let repository: PrismaReportRepository;

    beforeAll(async () => {
        await prisma.$connect();
        repository = new PrismaReportRepository();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);
    });

    describe("findById()", () => {
        it("retorna null si el reporte no existe", async () => {
            const report = await repository.findById(999999);
            expect(report).toBeNull();
        });

        it("retorna la entidad del reporte si existe", async () => {
            const user = await prisma.user.create({
                data: { email: "u@example.com", username: "u", password: "pwd", public_id: randomUUID() },
            });

            const report = await prisma.report.create({
                data: {
                    user_id: user.user_id,
                    report_type_id: 1,
                    report_status_id: 1,
                    location_address: "Test Location",
                    location_lat: 10,
                    location_lng: 20,
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                },
            });

            const found = await repository.findById(report.report_id);

            expect(found).not.toBeNull();
            expect(found!.reportId).toBe(report.report_id);
            expect(found!.location.locationLat).toBe(10);
            expect(found!.location.locationLng).toBe(20);
        });
    });

    describe("updateDescriptionEmbedding() and updateImageEmbedding()", () => {
        it("actualiza los embeddings de descripción e imagen correctamente", async () => {
            const user = await prisma.user.create({
                data: { email: "u@example.com", username: "u", password: "pwd", public_id: randomUUID() },
            });

            const report = await prisma.report.create({
                data: {
                    user_id: user.user_id,
                    report_type_id: 1,
                    report_status_id: 1,
                    location_address: "Test Location",
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                    location_lat: 10,
                    location_lng: 20,
                },
            });

            const reportImage = await prisma.reportImage.create({
                data: {
                    cloudinaryId: "image-id-xyz",
                    reportId: report.report_id,
                    photoUrl: "https://example.com/photo.jpg",
                },
            });

            const embedding = Array(384).fill(0.5);

            await repository.updateDescriptionEmbedding(report.report_id, embedding);
            await repository.updateImageEmbedding(reportImage.imageId, embedding);

            const reportRows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
                SELECT embedding_description::text AS embedding 
                FROM reports 
                WHERE report_id = ${report.report_id}
            `;
            const imageRows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
                SELECT embedding_photo::text AS embedding 
                FROM report_images 
                WHERE image_id = ${reportImage.imageId}
            `;

            expect(reportRows).toHaveLength(1);
            expect(reportRows[0]!.embedding).not.toBeNull();
            expect(reportRows[0]!.embedding).toContain("0.5");

            expect(imageRows).toHaveLength(1);
            expect(imageRows[0]!.embedding).not.toBeNull();
            expect(imageRows[0]!.embedding).toContain("0.5");
        });
    });

    describe("findCandidatesReportsActives()", () => {
        it("retorna reportes activos candidatos dentro del radio", async () => {
            const user1 = await prisma.user.create({
                data: { email: "u1@example.com", username: "u1", password: "pwd", public_id: randomUUID() },
            });
            const user2 = await prisma.user.create({
                data: { email: "u2@example.com", username: "u2", password: "pwd", public_id: randomUUID() },
            });


            const report1 = await prisma.report.create({
                data: {
                    user_id: user1.user_id,
                    report_type_id: 1,
                    report_status_id: 1,
                    location_address: "Address 1",
                    location_lat: -34.6037,
                    location_lng: -58.3816,
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                },
            });


            const report2 = await prisma.report.create({
                data: {
                    user_id: user2.user_id,
                    report_type_id: 2,
                    report_status_id: 1,
                    location_address: "Address 2",
                    location_lat: -34.6047,
                    location_lng: -58.3826,
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                },
            });

            const candidates = await repository.findCandidatesReportsActives(
                report1.report_id,
                1,
                { animalType: "DOG", hasIdIdentification: false },
                { locationLat: -34.6037, locationLng: -58.3816 }
            );

            expect(Array.isArray(candidates)).toBe(true);
        });
    });

    describe("saveMatchResults() and findMatchNotifications()", () => {
        it("persiste resultados de matches y recupera las notificaciones", async () => {
            const user1 = await prisma.user.create({
                data: { email: "u1@example.com", username: "u1", password: "pwd", public_id: randomUUID() },
            });
            const user2 = await prisma.user.create({
                data: { email: "u2@example.com", username: "u2", password: "pwd", public_id: randomUUID() },
            });

            const report1 = await prisma.report.create({
                data: {
                    user_id: user1.user_id,
                    report_type_id: 1,
                    report_status_id: 1,
                    location_address: "Address 1",
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                    location_lat: 0,
                    location_lng: 0,
                },
            });
            const report2 = await prisma.report.create({
                data: {
                    user_id: user2.user_id,
                    report_type_id: 2,
                    report_status_id: 1,
                    location_address: "Address 2",
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                    location_lat: 0,
                    location_lng: 0,
                },
            });

            const matchResult = {
                reportId: report2.report_id,
                publicId: randomUUID(),
                score: 0.88,
                imageScore: 0.9,
                descriptionScore: 0.8,
                structuredScore: 0.85,
                sharedFields: 4,
            };

            await repository.saveMatchResults(report1.report_id, [matchResult]);

            const notifications = await repository.findMatchNotifications(
                report1.report_id,
                [report2.report_id]
            );

            expect(notifications).toHaveLength(2);
            expect(notifications[0]!.score).toBe(0.88);
            expect(notifications[1]!.score).toBe(0.88);
        });
    });
});
