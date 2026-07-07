import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaReportFollowerRepository } from "../report-follower.repository";
import { PrismaReportRepository } from "../report.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Location } from "@domain/report/value-objects/location.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { ReportType } from "@domain/report/types/report.type";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";

let _imgCounter = 0;
function uniqueCloudId(): string {
    return `cloud-img-${Date.now()}-${++_imgCounter}`;
}

function makeSightingReport(userId: number): Report {
    return Report.create({
        userId,
        userPublicId: "irrelevant-public-id",
        type: ReportType.SIGHTING,
        description: null,
        details: SightingReportDetails.create({
            animalType: AnimalType.CAT,
            genderType: GenderType.MALE,
            sizeType: SizeType.MEDIUM,
            color: "Tricolor",
            breed: "Mestizo",
            hasIdCollar: false,
            isInTransit: false,
            images: [
                SightingImage.create({
                    cloudinaryId: uniqueCloudId(),
                    photoUrl: "https://example.com/photo.jpg",
                }),
            ],
        }),
        location: Location.create({
            address: "Avenida siempre viva 742",
            latitude: -34.6,
            longitude: -58.4,
        }),
        occurredAt: new Date(),
    });
}


describe("PrismaReportFollowerRepository (integration)", () => {
    let prisma: PrismaClient;
    let repository: PrismaReportFollowerRepository;
    let reportRepository: PrismaReportRepository;

    let followerPublicId: string;

    let reportPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaReportFollowerRepository(prisma);
        reportRepository = new PrismaReportRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const owner = await prisma.user.create({
            data: {
                email: "owner@example.com",
                username: "owner",
                password: "hashed",
            },
        });

        const follower = await prisma.user.create({
            data: {
                email: "follower@example.com",
                username: "follower",
                password: "hashed",
            },
        });
        followerPublicId = follower.public_id;

        const report = makeSightingReport(owner.user_id);
        await reportRepository.save(report);
        reportPublicId = report.publicId;
    });

    describe("follow()", () => {
        it("crea una relación de seguimiento entre usuario y reporte", async () => {
            await repository.follow(followerPublicId, reportPublicId);

            const row = await prisma.reportFollower.findFirst({
                where: {
                    user: { public_id: followerPublicId },
                    report: { public_id: reportPublicId },
                },
            });

            expect(row).not.toBeNull();
        });

        it("no lanza error si el usuario ya sigue el reporte (idempotente)", async () => {
            await repository.follow(followerPublicId, reportPublicId);
            await expect(
                repository.follow(followerPublicId, reportPublicId)
            ).resolves.toBeUndefined();
            const count = await prisma.reportFollower.count({
                where: {
                    user: { public_id: followerPublicId },
                    report: { public_id: reportPublicId },
                },
            });
            expect(count).toBe(1);
        });
    });

    describe("unfollow()", () => {
        it("elimina la relación de seguimiento existente", async () => {
            await repository.follow(followerPublicId, reportPublicId);
            await repository.unfollow(followerPublicId, reportPublicId);

            const row = await prisma.reportFollower.findFirst({
                where: {
                    user: { public_id: followerPublicId },
                    report: { public_id: reportPublicId },
                },
            });

            expect(row).toBeNull();
        });

        it("no lanza error si el seguimiento no existía", async () => {
            await expect(
                repository.unfollow(followerPublicId, reportPublicId)
            ).resolves.toBeUndefined();
        });
    });

    describe("isFollowing()", () => {
        it("devuelve true cuando el usuario sigue el reporte", async () => {
            await repository.follow(followerPublicId, reportPublicId);

            const result = await repository.isFollowing(followerPublicId, reportPublicId);

            expect(result).toBe(true);
        });

        it("devuelve false cuando el usuario no sigue el reporte", async () => {
            const result = await repository.isFollowing(followerPublicId, reportPublicId);

            expect(result).toBe(false);
        });

        it("devuelve false después de dejar de seguir", async () => {
            await repository.follow(followerPublicId, reportPublicId);
            await repository.unfollow(followerPublicId, reportPublicId);

            const result = await repository.isFollowing(followerPublicId, reportPublicId);

            expect(result).toBe(false);
        });
    });


    describe("findFollowerPublicIdsByReportPublicId()", () => {
        it("devuelve los publicIds de todos los seguidores del reporte", async () => {

            const follower2 = await prisma.user.create({
                data: {
                    email: "follower2@example.com",
                    username: "follower2",
                    password: "hashed",
                },
            });

            await repository.follow(followerPublicId, reportPublicId);
            await repository.follow(follower2.public_id, reportPublicId);

            const ids = await repository.findFollowerPublicIdsByReportPublicId(reportPublicId);

            expect(ids).toHaveLength(2);
            expect(ids).toContain(followerPublicId);
            expect(ids).toContain(follower2.public_id);
        });

        it("devuelve lista vacía cuando el reporte no tiene seguidores", async () => {
            const ids = await repository.findFollowerPublicIdsByReportPublicId(reportPublicId);

            expect(ids).toHaveLength(0);
        });

        it("devuelve solo los seguidores del reporte correcto, no de otros", async () => {

            const owner2 = await prisma.user.create({
                data: {
                    email: "owner2@example.com",
                    username: "owner2",
                    password: "hashed",
                },
            });
            const otherReport = makeSightingReport(owner2.user_id);
            await reportRepository.save(otherReport);

            await repository.follow(followerPublicId, otherReport.publicId);

            const ids = await repository.findFollowerPublicIdsByReportPublicId(reportPublicId);

            expect(ids).toHaveLength(0);
        });

        it("devuelve lista vacía después de que todos dejan de seguir", async () => {
            await repository.follow(followerPublicId, reportPublicId);
            await repository.unfollow(followerPublicId, reportPublicId);

            const ids = await repository.findFollowerPublicIdsByReportPublicId(reportPublicId);

            expect(ids).toHaveLength(0);
        });
    });
});
