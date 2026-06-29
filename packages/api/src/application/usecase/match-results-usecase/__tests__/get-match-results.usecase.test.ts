import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMatchResultsUseCase } from "../get-match-results.usecase";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { MatchResultsEntity } from "@domain/match/entities/MatchResultsEntity";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { AnimalType } from "@domain/shared/animal-type/animal-type";


function makeMatchEntity(overrides: Partial<{
    id: number;
    publicId: string;
    sourceReportId: number;
    candidateReportId: number;
    score: number;
    imageScore: number;
    descriptionScore: number;
}> = {}): MatchResultsEntity {
    return MatchResultsEntity.create({
        id: 1,
        publicId: "match-pub-id",
        sourceReportId: 10,
        candidateReportId: 20,
        score: 0.9,
        imageScore: 0.8,
        descriptionScore: 0.6,
        ...overrides,
    });
}

function makeReport(idReport = 20, publicId = "candidate-pub-id") {
    return {
        idReport,
        publicId,
    } as any;
}

function makePet() {
    return {
        images: [{ photoUrl: "https://img.example.com/dog.jpg" }],
        animalType: "DOG",
    } as any;
}

let matchResultsRepository: MatchResultsRepository;
let reportRepository: ReportRepository;
let useCase: GetMatchResultsUseCase;

beforeEach(() => {
    matchResultsRepository = {
        findById: vi.fn(),
        findResultsBySourceReportId: vi.fn(),
    } as unknown as MatchResultsRepository;

    reportRepository = {
        save: vi.fn(),
        findByPublicId: vi.fn(),
        findDetailByPublicId: vi.fn(),
        findByUserPublicId: vi.fn(),
        findIdsByQuery: vi.fn(),
        findByIds: vi.fn(),
        findDetailsByIds: vi.fn(),
        update: vi.fn(),
        findImagesByReportId: vi.fn(),
        updateFields: vi.fn(),
    } as unknown as ReportRepository;

    useCase = new GetMatchResultsUseCase(matchResultsRepository, reportRepository);
});


describe("GetMatchResultsUseCase", () => {

    describe("execute — reporte fuente encontrado con candidatos (mascota perdida)", () => {
        it("retorna resultados mapeados correctamente cuando hay un match con pet", async () => {
            const sourceReport = makeReport(10, "source-pub-id");
            const candidatePet = makePet();
            const candidateReport = makeReport(20, "candidate-pub-id");

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 20, score: 0.9, imageScore: 0.85, descriptionScore: 0.7, publicId: "match-pub-id" }),
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([
                { report: candidateReport, pet: candidatePet },
            ]);

            const result = await useCase.execute("source-pub-id");

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                publicId: "match-pub-id",
                sourceReportPublicId: "source-pub-id",
                score: 0.9,
                imageScore: 0.85,
                descriptionScore: 0.7,
                details: {
                    publicId: "candidate-pub-id",
                    animalType: "DOG",
                    images: ["https://img.example.com/dog.jpg"],
                },
            });
        });
    });



    describe("execute — reporte fuente encontrado con candidatos (avistamiento)", () => {
        it("retorna resultados mapeados con SightingReportDetails cuando no hay pet", async () => {
            const sightingDetails = SightingReportDetails.create({
                animalType: AnimalType.CAT,
                hasIdCollar: false,
                color: "orange",
                isInTransit: false,
                images: [SightingImage.create({ cloudinaryId: "cloud-1", photoUrl: "https://img.example.com/cat.jpg" })],
            });

            const sourceReport = makeReport(10, "source-pub-id");
            const candidateReport = {
                idReport: 20,
                publicId: "sighting-candidate-pub-id",
                details: sightingDetails,
            } as any;

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 20, score: 0.75, publicId: "match-sighting-id" }),
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([
                { report: candidateReport, pet: undefined as any },
            ]);

            const result = await useCase.execute("source-pub-id");

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                publicId: "match-sighting-id",
                score: 0.75,
                details: {
                    publicId: "sighting-candidate-pub-id",
                    animalType: AnimalType.CAT,
                    images: ["https://img.example.com/cat.jpg"],
                },
            });
        });
    });


    describe("execute — sin candidatos de match", () => {
        it("retorna array vacío cuando no hay resultados de match", async () => {
            const sourceReport = makeReport(10, "source-pub-id");

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([]);

            const result = await useCase.execute("source-pub-id");


            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });


    describe("execute — reporte fuente no encontrado", () => {
        it("lanza ReportNotFoundError cuando el reporte no existe", async () => {
            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

            await expect(useCase.execute("non-existent-id"))
                .rejects
                .toThrow(ReportNotFoundError);

            expect(matchResultsRepository.findResultsBySourceReportId).not.toHaveBeenCalled();
            expect(reportRepository.findDetailsByIds).not.toHaveBeenCalled();
        });

        it("lanza ReportNotFoundError si el reporte encontrado tiene idReport null (invariante roto)", async () => {

            const reportWithNullId = makeReport(null as any, "some-pub-id");
            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reportWithNullId);

            await expect(useCase.execute("some-pub-id"))
                .rejects
                .toThrow(ReportNotFoundError);

            expect(matchResultsRepository.findResultsBySourceReportId).not.toHaveBeenCalled();
        });
    });



    describe("execute — filtra resultados sin detalles disponibles", () => {
        it("excluye matches cuyo candidateReportId no tiene detalles en el repositorio", async () => {
            const sourceReport = makeReport(10, "source-pub-id");


            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 20, score: 0.9, publicId: "match-a" }),
                makeMatchEntity({ candidateReportId: 99, score: 0.72, publicId: "match-b" }),  // sin detalles
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([
                { report: makeReport(20, "candidate-a"), pet: makePet() },

            ]);

            const result = await useCase.execute("source-pub-id");

            expect(result).toHaveLength(1);
            expect(result[0]!.publicId).toBe("match-a");
        });
    });


    describe("execute — publicId del match es propagado correctamente", () => {
        it("incluye el publicId del match en cada resultado", async () => {
            const sourceReport = makeReport(10, "source-pub-id");
            const candidatePet = makePet();
            const candidateReport = makeReport(20, "candidate-pub-id");

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 20, score: 0.8, publicId: "expected-match-uuid" }),
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([
                { report: candidateReport, pet: candidatePet },
            ]);

            const result = await useCase.execute("source-pub-id");

            expect(result).toHaveLength(1);
            expect(result[0]!.publicId).toBe("expected-match-uuid");
        });
    });


    describe("execute — preserva el orden por score descendente", () => {
        it("mantiene el orden de los candidatos devuelto por el repositorio", async () => {
            const sourceReport = makeReport(10, "source-pub-id");

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 20, score: 0.95, publicId: "high-score" }),
                makeMatchEntity({ candidateReportId: 30, score: 0.75, publicId: "low-score" }),
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([
                { report: makeReport(20, "report-high"), pet: makePet() },
                { report: makeReport(30, "report-low"), pet: makePet() },
            ]);

            const result = await useCase.execute("source-pub-id");

            expect(result[0]!.score).toBe(0.95);
            expect(result[1]!.score).toBe(0.75);
        });
    });

    describe("execute — llama a findDetailsByIds con los IDs correctos", () => {
        it("pasa los candidateReportIds extraídos al repositorio de reportes", async () => {
            const sourceReport = makeReport(10, "source-pub-id");

            vi.mocked(reportRepository.findByPublicId).mockResolvedValue(sourceReport);
            vi.mocked(matchResultsRepository.findResultsBySourceReportId).mockResolvedValue([
                makeMatchEntity({ candidateReportId: 42, score: 0.8, publicId: "m1" }),
                makeMatchEntity({ candidateReportId: 77, score: 0.7, publicId: "m2" }),
            ]);
            vi.mocked(reportRepository.findDetailsByIds).mockResolvedValue([]);

            await useCase.execute("source-pub-id");

            expect(reportRepository.findDetailsByIds).toHaveBeenCalledWith([42, 77]);
        });
    });
});
