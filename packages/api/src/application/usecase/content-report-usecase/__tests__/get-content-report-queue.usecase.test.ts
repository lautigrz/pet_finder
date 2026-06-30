import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetContentReportQueueUseCase } from "@application/usecase/content-report-usecase/get-content-report-queue.usecase";
import { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReport } from "@domain/content-report/ContentReport";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";

const fakeReport = ContentReport.restore({
    contentReportId: 1,
    publicId: "content-report-public-id",
    reporterUserId: 5,
    targetType: ContentReportTargetType.CHAT,
    targetPublicId: "chat-public-uuid",
    reason: ContentReportReason.SUSPICIOUS_BEHAVIOR,
    status: ContentReportStatus.PENDING,
    description: "Me pidió dinero",
    suspensionReason: null,
    autoFlagged: true,
    createdAt: new Date("2026-06-20"),
});

describe("GetContentReportQueueUseCase", () => {
    let contentReportRepository: ContentReportRepository;
    let useCase: GetContentReportQueueUseCase;

    beforeEach(() => {
        contentReportRepository = {
            findQueueByStatus: vi.fn().mockResolvedValue([
                {
                    report: fakeReport,
                    reporter: { publicId: "reporter-public-id", username: "reporter" },
                    reportedUser: { username: "reported-user" },
                    reportCount: 3,
                },
            ]),
        } as unknown as ContentReportRepository;

        useCase = new GetContentReportQueueUseCase(contentReportRepository);
    });

    it("pide la cola con estado PENDING por defecto", async () => {
        await useCase.execute();

        expect(contentReportRepository.findQueueByStatus).toHaveBeenCalledWith(ContentReportStatus.PENDING);
    });

    it("pide la cola con el estado indicado", async () => {
        await useCase.execute(ContentReportStatus.DISMISSED);

        expect(contentReportRepository.findQueueByStatus).toHaveBeenCalledWith(ContentReportStatus.DISMISSED);
    });

    it("mapea cada denuncia con los datos del denunciante", async () => {
        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            publicId: "content-report-public-id",
            targetType: ContentReportTargetType.CHAT,
            targetPublicId: "chat-public-uuid",
            reason: ContentReportReason.SUSPICIOUS_BEHAVIOR,
            status: ContentReportStatus.PENDING,
            description: "Me pidió dinero",
            suspensionReason: null,
            autoFlagged: true,
            createdAt: new Date("2026-06-20"),
            reportCount: 3,
            reportedUser: { username: "reported-user" },
            reporter: { publicId: "reporter-public-id", username: "reporter" },
        });
    });
});
