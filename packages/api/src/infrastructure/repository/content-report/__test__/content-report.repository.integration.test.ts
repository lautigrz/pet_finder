import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaContentReportRepository } from "../content-report.repository";
import { ContentReport } from "@domain/content-report/ContentReport";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

describe("PrismaContentReportRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaContentReportRepository;
    let reporterUserId: number;
    let targetPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaContentReportRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const reporter = await prisma.user.create({
            data: { email: "reporter@example.com", username: "reporter", password: "hashed" },
        });

        reporterUserId = reporter.user_id;
        targetPublicId = randomUUID();
    });

    function makePostReport(overrides: Partial<{
        reporterUserId: number;
        targetPublicId: string;
        reason: typeof ContentReportReason[keyof typeof ContentReportReason];
    }> = {}): ContentReport {
        return ContentReport.create({
            publicId: randomUUID(),
            reporterUserId: overrides.reporterUserId ?? reporterUserId,
            targetType: ContentReportTargetType.POST,
            targetPublicId: overrides.targetPublicId ?? targetPublicId,
            reason: overrides.reason ?? ContentReportReason.FALSE_INFORMATION,
            description: null,
        });
    }

    describe("save()", () => {
        it("guarda un content report y retorna su id numérico", async () => {
            const report = makePostReport();

            const id = await repository.save(report);

            expect(typeof id).toBe("number");
            expect(id).toBeGreaterThan(0);
        });

        it("persiste correctamente los datos del reporte", async () => {
            const report = makePostReport();
            const id = await repository.save(report);

            const raw = await prisma.contentReport.findUnique({
                where: { content_report_id: id },
            });

            expect(raw).not.toBeNull();
            expect(raw!.public_id).toBe(report.publicId);
            expect(raw!.reporter_user_id).toBe(reporterUserId);
            expect(raw!.target_public_id).toBe(targetPublicId);
        });
    });

    describe("findByReporterAndTarget()", () => {
        it("retorna el reporte existente para un reporter y target", async () => {
            const report = makePostReport();
            await repository.save(report);

            const found = await repository.findByReporterAndTarget(
                reporterUserId,
                ContentReportTargetType.POST,
                targetPublicId,
            );

            expect(found).not.toBeNull();
            expect(found!.publicId).toBe(report.publicId);
            expect(found!.reporterUserId).toBe(reporterUserId);
            expect(found!.targetPublicId).toBe(targetPublicId);
            expect(found!.targetType).toBe(ContentReportTargetType.POST);
        });

        it("retorna null cuando no existe el reporte", async () => {
            const found = await repository.findByReporterAndTarget(
                reporterUserId,
                ContentReportTargetType.POST,
                randomUUID(),
            );

            expect(found).toBeNull();
        });

        it("distingue entre tipos de target distintos para el mismo publicId", async () => {
            const sameTargetPublicId = randomUUID();
            await repository.save(makePostReport({ targetPublicId: sameTargetPublicId }));

            const found = await repository.findByReporterAndTarget(
                reporterUserId,
                ContentReportTargetType.CHAT,
                sameTargetPublicId,
            );

            expect(found).toBeNull();
        });
    });

    describe("countByTarget()", () => {
        it("retorna 0 cuando no hay reportes para ese target", async () => {
            const count = await repository.countByTarget(ContentReportTargetType.POST, targetPublicId);
            expect(count).toBe(0);
        });

        it("retorna la cantidad correcta de reportes para un target", async () => {
            const reporter2 = await prisma.user.create({
                data: { email: "reporter2@example.com", username: "reporter2", password: "hashed" },
            });
            const reporter3 = await prisma.user.create({
                data: { email: "reporter3@example.com", username: "reporter3", password: "hashed" },
            });

            await repository.save(makePostReport({ reporterUserId: reporterUserId }));
            await repository.save(makePostReport({ reporterUserId: reporter2.user_id }));
            await repository.save(makePostReport({ reporterUserId: reporter3.user_id }));

            const count = await repository.countByTarget(ContentReportTargetType.POST, targetPublicId);
            expect(count).toBe(3);
        });

        it("no cuenta reportes de otro tipo de target con el mismo publicId", async () => {
            await repository.save(makePostReport({ targetPublicId: targetPublicId }));

            const count = await repository.countByTarget(ContentReportTargetType.CHAT, targetPublicId);
            expect(count).toBe(0);
        });
    });

    describe("flagTarget()", () => {
        it("marca como auto_flagged todos los reportes del target", async () => {
            const reporter2 = await prisma.user.create({
                data: { email: "reporter2@example.com", username: "reporter2", password: "hashed" },
            });

            await repository.save(makePostReport({ reporterUserId: reporterUserId }));
            await repository.save(makePostReport({ reporterUserId: reporter2.user_id }));

            await repository.flagTarget(ContentReportTargetType.POST, targetPublicId);

            const flagged = await prisma.contentReport.findMany({
                where: { target_public_id: targetPublicId },
            });

            expect(flagged).toHaveLength(2);
            flagged.forEach((r) => expect(r.auto_flagged).toBe(true));
        });

        it("no afecta reportes de otros targets", async () => {
            const otherTargetPublicId = randomUUID();
            const reporter2 = await prisma.user.create({
                data: { email: "reporter2@example.com", username: "reporter2", password: "hashed" },
            });

            await repository.save(makePostReport({ targetPublicId: targetPublicId }));
            await repository.save(makePostReport({
                targetPublicId: otherTargetPublicId,
                reporterUserId: reporter2.user_id,
            }));

            await repository.flagTarget(ContentReportTargetType.POST, targetPublicId);

            const untouched = await prisma.contentReport.findFirst({
                where: { target_public_id: otherTargetPublicId },
            });
            expect(untouched!.auto_flagged).toBe(false);
        });
    });

    describe("findQueueByStatus()", () => {
        it("retorna los reportes pendientes con datos del reporter", async () => {
            await repository.save(makePostReport());

            const queue = await repository.findQueueByStatus(ContentReportStatus.PENDING);

            expect(queue.length).toBeGreaterThanOrEqual(1);
            const item = queue.find((q) => q.report.reporterUserId === reporterUserId);
            expect(item).toBeDefined();
            expect(item!.reporter.username).toBe("reporter");
            expect(item!.reportCount).toBeGreaterThanOrEqual(1);
        });

        it("retorna lista vacía cuando no hay reportes con ese status", async () => {
            const queue = await repository.findQueueByStatus(ContentReportStatus.REVIEWED);
            expect(queue).toHaveLength(0);
        });

        it("los reportes auto_flagged aparecen primero", async () => {
            const reporter2 = await prisma.user.create({
                data: { email: "reporter2@example.com", username: "reporter2", password: "hashed" },
            });
            const reporter3 = await prisma.user.create({
                data: { email: "reporter3@example.com", username: "reporter3", password: "hashed" },
            });

            const normalTargetId = randomUUID();
            const flaggedTargetId = randomUUID();

            await repository.save(makePostReport({ reporterUserId: reporterUserId, targetPublicId: normalTargetId }));
            await repository.save(makePostReport({ reporterUserId: reporter2.user_id, targetPublicId: flaggedTargetId }));
            await repository.save(makePostReport({ reporterUserId: reporter3.user_id, targetPublicId: flaggedTargetId }));

            await repository.flagTarget(ContentReportTargetType.POST, flaggedTargetId);

            const queue = await repository.findQueueByStatus(ContentReportStatus.PENDING);

            expect(queue.length).toBeGreaterThanOrEqual(2);
            const firstFlagged = queue.findIndex((q) => q.report.autoFlagged);
            const firstNotFlagged = queue.findIndex((q) => !q.report.autoFlagged);
            if (firstFlagged !== -1 && firstNotFlagged !== -1) {
                expect(firstFlagged).toBeLessThan(firstNotFlagged);
            }
        });
    });
});
