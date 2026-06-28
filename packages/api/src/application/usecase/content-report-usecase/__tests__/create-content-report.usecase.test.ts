import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateContentReportUseCase } from "@application/usecase/content-report-usecase/create-content-report.usecase";
import { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { CannotReportOwnContentError } from "@domain/content-report/errors/CannotReportOwnContentError";
import { NotChatParticipantError } from "@domain/content-report/errors/NotChatParticipantError";
import { ContentAlreadyReportedError } from "@domain/content-report/errors/ContentAlreadyReportedError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import { InvalidReportReasonError } from "@domain/content-report/errors/InvalidReportReasonError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Conversation } from "@domain/conversation/Conversation";

const REPORTER_PUBLIC_ID = "reporter-public-id";
const REPORTER_INTERNAL_ID = 5;
const POST_PUBLIC_ID = "post-public-uuid";
const CHAT_PUBLIC_ID = "chat-public-uuid";

const fakeReporter = User.reconstruct(
    REPORTER_INTERNAL_ID,
    REPORTER_PUBLIC_ID,
    "reporter@example.com",
    "reporter",
    "$2b$10$" + "x".repeat(53),
    true,
    new Date(),
    "Nadia",
    "Belen",
    null,
);

const otherUsersReport = { userId: 99 } as unknown as Report;

describe("CreateContentReportUseCase", () => {
    let contentReportRepository: ContentReportRepository;
    let userRepository: IUserRepository;
    let reportRepository: ReportRepository;
    let conversationRepository: ConversationRepository;
    let useCase: CreateContentReportUseCase;

    beforeEach(() => {
        contentReportRepository = {
            save: vi.fn().mockResolvedValue(1),
            findByReporterAndTarget: vi.fn().mockResolvedValue(null),
            countByTarget: vi.fn().mockResolvedValue(1),
            flagTarget: vi.fn().mockResolvedValue(undefined),
            findQueueByStatus: vi.fn(),
        } as unknown as ContentReportRepository;

        userRepository = {
            findByPublicId: vi.fn().mockResolvedValue(fakeReporter),
        } as unknown as IUserRepository;

        reportRepository = {
            findByPublicId: vi.fn().mockResolvedValue(otherUsersReport),
        } as unknown as ReportRepository;

        conversationRepository = {
            findByPublicId: vi.fn().mockResolvedValue({
                hasParticipant: vi.fn().mockReturnValue(true),
            } as unknown as Conversation),
        } as unknown as ConversationRepository;

        useCase = new CreateContentReportUseCase(
            contentReportRepository,
            userRepository,
            reportRepository,
            conversationRepository,
        );
    });

    describe("denuncia de publicación (POST)", () => {
        const postDto = {
            targetType: ContentReportTargetType.POST,
            targetPublicId: POST_PUBLIC_ID,
            reason: ContentReportReason.FALSE_INFORMATION,
            description: null,
        };

        it("crea y guarda la denuncia correctamente", async () => {
            const result = await useCase.execute(postDto, REPORTER_PUBLIC_ID);

            expect(contentReportRepository.save).toHaveBeenCalledOnce();
            expect(result.publicId).toEqual(expect.any(String));
            expect(result.autoFlagged).toBe(false);
        });

        it("lanza CannotReportOwnContentError si denuncia su propia publicación", async () => {
            vi.mocked(reportRepository.findByPublicId).mockResolvedValue({
                userId: REPORTER_INTERNAL_ID,
            } as unknown as Report);

            await expect(useCase.execute(postDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                CannotReportOwnContentError,
            );
            expect(contentReportRepository.save).not.toHaveBeenCalled();
        });

        it("lanza ReportedContentNotFoundError si la publicación no existe", async () => {
            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

            await expect(useCase.execute(postDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                ReportedContentNotFoundError,
            );
        });

        it("lanza InvalidReportReasonError si el motivo no corresponde al tipo", async () => {
            const invalidDto = { ...postDto, reason: ContentReportReason.SUSPICIOUS_BEHAVIOR };

            await expect(useCase.execute(invalidDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                InvalidReportReasonError,
            );
        });
    });

    describe("denuncia de chat (CHAT)", () => {
        const chatDto = {
            targetType: ContentReportTargetType.CHAT,
            targetPublicId: CHAT_PUBLIC_ID,
            reason: ContentReportReason.SUSPICIOUS_BEHAVIOR,
            description: "Me pidió dinero",
        };

        it("crea y guarda la denuncia correctamente", async () => {
            await useCase.execute(chatDto, REPORTER_PUBLIC_ID);

            expect(contentReportRepository.save).toHaveBeenCalledOnce();
        });

        it("lanza NotChatParticipantError si no es participante de la conversación", async () => {
            vi.mocked(conversationRepository.findByPublicId).mockResolvedValue({
                hasParticipant: vi.fn().mockReturnValue(false),
            } as unknown as Conversation);

            await expect(useCase.execute(chatDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                NotChatParticipantError,
            );
        });

        it("lanza ReportedContentNotFoundError si el chat no existe", async () => {
            vi.mocked(conversationRepository.findByPublicId).mockResolvedValue(null);

            await expect(useCase.execute(chatDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                ReportedContentNotFoundError,
            );
        });
    });

    describe("validaciones generales", () => {
        const postDto = {
            targetType: ContentReportTargetType.POST,
            targetPublicId: POST_PUBLIC_ID,
            reason: ContentReportReason.SPAM,
            description: null,
        };

        it("lanza UserNotFoundError si el denunciante no existe", async () => {
            vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

            await expect(useCase.execute(postDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                UserNotFoundError,
            );
        });

        it("lanza ContentAlreadyReportedError si ya denunció ese contenido", async () => {
            vi.mocked(contentReportRepository.findByReporterAndTarget).mockResolvedValue(
                {} as unknown as Awaited<ReturnType<ContentReportRepository["findByReporterAndTarget"]>>,
            );

            await expect(useCase.execute(postDto, REPORTER_PUBLIC_ID)).rejects.toThrow(
                ContentAlreadyReportedError,
            );
            expect(contentReportRepository.save).not.toHaveBeenCalled();
        });
    });

    describe("auto-flag", () => {
        const postDto = {
            targetType: ContentReportTargetType.POST,
            targetPublicId: POST_PUBLIC_ID,
            reason: ContentReportReason.SPAM,
            description: null,
        };

        it("no marca auto-flag si no alcanza el umbral", async () => {
            vi.mocked(contentReportRepository.countByTarget).mockResolvedValue(4);

            const result = await useCase.execute(postDto, REPORTER_PUBLIC_ID);

            expect(result.autoFlagged).toBe(false);
            expect(contentReportRepository.flagTarget).not.toHaveBeenCalled();
        });

        it("marca auto-flag al alcanzar el umbral de 5 reportes", async () => {
            vi.mocked(contentReportRepository.countByTarget).mockResolvedValue(5);

            const result = await useCase.execute(postDto, REPORTER_PUBLIC_ID);

            expect(result.autoFlagged).toBe(true);
            expect(contentReportRepository.flagTarget).toHaveBeenCalledWith(
                ContentReportTargetType.POST,
                POST_PUBLIC_ID,
            );
        });
    });
});
