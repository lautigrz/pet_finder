import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetUserMatchNotificationsUseCase } from "../get-user-match-notifications.usecase";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { MatchNotification } from "@pet-alert/shared";

function makeNotification(overrides: Partial<MatchNotification> = {}): MatchNotification {
    return {
        ownerPublicId: "user-1",
        rol: "dueno",
        lostReportPublicId: "lost-1",
        lostPetName: "naranja",
        lostPetImage: null,
        matchPublicId: "match-1",
        matchedReportPublicId: "sighting-1",
        matchedImage: "https://img.example.com/1.jpg",
        score: 0.9,
        seen: false,
        createdAt: "2026-06-19T18:00:00.000Z",
        ...overrides,
    };
}

let matchResultsRepository: MatchResultsRepository;
let useCase: GetUserMatchNotificationsUseCase;

beforeEach(() => {
    matchResultsRepository = {
        findById: vi.fn(),
        findResultsBySourceReportId: vi.fn(),
        findNotificationsByUser: vi.fn(),
    } as unknown as MatchResultsRepository;

    useCase = new GetUserMatchNotificationsUseCase(matchResultsRepository);
});

describe("GetUserMatchNotificationsUseCase", () => {
    it("pide las notificaciones del usuario logueado", async () => {
        vi.mocked(matchResultsRepository.findNotificationsByUser).mockResolvedValue([makeNotification()]);

        await useCase.execute("user-1");

        expect(matchResultsRepository.findNotificationsByUser).toHaveBeenCalledWith("user-1");
    });

    it("descarta las coincidencias por debajo del umbral", async () => {
        vi.mocked(matchResultsRepository.findNotificationsByUser).mockResolvedValue([
            makeNotification({ matchPublicId: "alta", score: 0.8 }),
            makeNotification({ matchPublicId: "baja", score: 0.5 }),
        ]);

        const result = await useCase.execute("user-1");

        expect(result).toHaveLength(1);
        expect(result[0]!.matchPublicId).toBe("alta");
    });
});
