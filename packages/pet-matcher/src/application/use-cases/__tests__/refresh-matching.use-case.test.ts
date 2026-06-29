import { ReportEntity } from '@domain/entities/report.entity';
import { IPetRepository } from '@domain/repositories/pet.repository';
import { IReportRepository } from '@domain/repositories/report.repository';
import { IMatchNotifier } from '@domain/services/match-notifier';
import { MatchingDomainService } from '@domain/services/matching.domain-service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RunMatchingUseCase } from '../run-matching.use-case';
import { RefreshMatchingUseCase } from '../refresh-matching.use-case';
import { IMatchRepository, MatchResultRaw } from '@domain/repositories/match.repository';
import { DataChangeType, MATCH_NOTIFICATION_THRESHOLD } from '@pet-alert/shared';
import { extractEmbedding } from '@services/embedding-images-services';
import { extractDescriptionEmbedding } from '@services/embedding-description-services';
import { MatchResult } from '@domain/entities/match-result.entity';

vi.mock('@services/embedding-images-services', () => ({
    extractEmbedding: vi.fn().mockResolvedValue([1, 0, 0]),
}));

vi.mock('@services/embedding-description-services', () => ({
    extractDescriptionEmbedding: vi.fn().mockResolvedValue([0, 1, 0]),
}));

function makeReport(overrides: Partial<ReportEntity> = {}): ReportEntity {
    return {
        reportId: 2,
        publicId: "dasdasd-31dAd-fdad",
        reportTypeId: 1,
        reportStatusId: 1,
        description: "Descripcion de prueba",
        embeddingDescription: [1, 2, 3],
        images: [{
            imageId: 1,
            photoUrl: "https://example.com/image.jpg",
            embeddingPhoto: [1, 3, 2],
        }],
        location: { locationLat: -34.6, locationLng: -58.4 },
        details: { hasIdIdentification: false },
        ...overrides,
    };
}

function makeReportRepo(overrides: Partial<IReportRepository> = {}): IReportRepository {
    return {
        findById: vi.fn(),
        findCandidatesReportsActives: vi.fn(),
        updateDescriptionEmbedding: vi.fn(),
        updateImageEmbedding: vi.fn(),
        saveMatchResults: vi.fn(),
        findMatchNotifications: vi.fn(),
        ...overrides,
    };
}

function makeMatchResultRaw(overrides: Partial<MatchResultRaw> = {}): MatchResultRaw {
    return {
        source_report_id: 1,
        candidate_report_id: 2,
        score: 0.8,
        ...overrides,
    }
}

function makeMatchRepo(overrides: Partial<IMatchRepository> = {}): IMatchRepository {
    return {
        findMatchResults: vi.fn(),
        ...overrides,
    };
}

function makePetRepo(overrides: Partial<IPetRepository> = {}): IPetRepository {
    return {
        updateImageEmbedding: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function makeMatchResult(overrides: Partial<MatchResult> = {}): MatchResult {
    return {
        reportId: 1,
        publicId: "dasdasd-31dAd-fdad",
        score: 0.8,
        imageScore: 0.8,
        descriptionScore: 0.8,
        structuredScore: 0.8,
        sharedFields: 0.8,
        ...overrides,
    }
}

function makeNotifier(overrides: Partial<IMatchNotifier> = {}): IMatchNotifier {
    return {
        publish: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

let matchingService: {
    rankCandidates: ReturnType<typeof vi.fn>;
};

const LOST_TYPE = 1;
const SIGHTING_TYPE = 2;
const SCORE_IMPROVEMENT_THRESHOLD = 0.05;

describe('RefreshMatchingUseCase', () => {
    let reportRepo: IReportRepository;
    let petRepo: IPetRepository;
    let matchingService: MatchingDomainService;
    let matchNotifier: IMatchNotifier;
    let matchRepository: IMatchRepository;
    let useCase: RefreshMatchingUseCase;


    beforeEach(() => {
        vi.clearAllMocks();
        reportRepo = makeReportRepo();
        petRepo = makePetRepo();
        matchingService = {
            rankCandidates: vi.fn(),
            computeScores: vi.fn(),

        };
        matchNotifier = makeNotifier();
        matchRepository = makeMatchRepo();
        useCase = new RefreshMatchingUseCase(reportRepo, petRepo, matchRepository, matchingService as unknown as MatchingDomainService, matchNotifier);
    })

    describe('cuando el reporte no existe', () => {
        it('lanza un error con el id del reporte', async () => {

            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            await expect(useCase.execute(129, LOST_TYPE, [])).rejects.toThrow('Report not found: 129');

        })
    })
    describe('cuando el reporte existe', () => {
        it('continúa el flujo de matching cuando encuentra el reporte', async () => {
            const report = makeReport();

            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);

            const result = await useCase.execute(2, LOST_TYPE, []);

            expect(result).toEqual(rankingResults);
            expect(matchingService.rankCandidates).toHaveBeenCalledWith(report, candidates);
        });

        describe("ejecuta updateEmbedding cuando", () => {
            it('tiene cambios en imagenes y ejecuta updateImageEmbedding de petRepository cuando el reporte es de tipo LOST', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
                } as any);

                const report = makeReport({
                    reportTypeId: LOST_TYPE,
                    images: [
                        {
                            imageId: 1,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 2,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 3,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 4,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: null,
                        }
                    ]
                });

                (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
                const changes = [DataChangeType.IMAGE];

                const candidates = [
                    makeReport({ reportId: 3 }),
                    makeReport({ reportId: 4 }),
                ];

                (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                    .mockResolvedValue(candidates);

                const rankingResults = [
                    makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
                ];

                (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                    .mockReturnValue(rankingResults);


                await useCase.execute(2, LOST_TYPE, changes);
                expect(petRepo.updateImageEmbedding).toHaveBeenCalled();
            })

            it('tiene cambios en imagenes y ejecuta updateImageEmbedding de reportRepository cuando el reporte no es de tipo LOST', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
                } as any);

                const report = makeReport({
                    reportTypeId: SIGHTING_TYPE,
                    images: [
                        {
                            imageId: 1,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 2,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 3,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 4,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: null,
                        }
                    ]
                });

                (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
                const changes = [DataChangeType.IMAGE];

                const candidates = [
                    makeReport({ reportId: 3 }),
                    makeReport({ reportId: 4 }),
                ];

                (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                    .mockResolvedValue(candidates);

                const rankingResults = [
                    makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
                ];

                (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                    .mockReturnValue(rankingResults);


                await useCase.execute(2, SIGHTING_TYPE, changes);
                expect(reportRepo.updateImageEmbedding).toHaveBeenCalled();
            })

            it('tiene cambios de imagen pero la extracción de embedding falla y lanza un error', async () => {
                global.fetch = vi.fn().mockResolvedValue({
                    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
                } as any);

                vi.mocked(extractEmbedding)
                    .mockResolvedValue(null);

                const report = makeReport({
                    reportTypeId: LOST_TYPE,
                    images: [
                        {
                            imageId: 1,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: [1, 3, 2],
                        },
                        {
                            imageId: 2,
                            photoUrl: "https://example.com/image.jpg",
                            embeddingPhoto: null,
                        },

                    ]
                });

                (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
                const changes = [DataChangeType.IMAGE];

                const candidates = [
                    makeReport({ reportId: 3 }),
                    makeReport({ reportId: 4 }),
                ];

                (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                    .mockResolvedValue(candidates);

                const rankingResults = [
                    makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
                ];

                (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                    .mockReturnValue(rankingResults);

                await expect(
                    useCase.execute(2, LOST_TYPE, changes)
                ).rejects.toThrow(
                    'Failed to process'
                );
            })



        })

        it('veficia que los cambios incluyen descripcion', async () => {
            const report = makeReport({ description: "perro grande perdido" });
            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
            const changes = [DataChangeType.DESCRIPTION];

            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);
            await useCase.execute(2, LOST_TYPE, changes);

            expect(reportRepo.updateDescriptionEmbedding).toHaveBeenCalled();
        })

        it('veficia que los cambios incluyen descripcion pero falla en la extraccion del embedding de la descripcion', async () => {
            vi.mocked(extractDescriptionEmbedding)
                .mockResolvedValue(null);

            const report = makeReport({ description: "perro grande perdido" });
            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
            const changes = [DataChangeType.DESCRIPTION];

            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);
            await expect(
                useCase.execute(2, LOST_TYPE, changes)
            ).rejects.toThrow(
                'No description embedding returned for description'
            );
        })

        it('no hace nada si no hay cambios', async () => {
            const report = makeReport({ description: "perro grande perdido" });
            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);

            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);


            await useCase.execute(2, LOST_TYPE, []);
            expect(reportRepo.updateImageEmbedding).not.toHaveBeenCalled();
            expect(reportRepo.updateDescriptionEmbedding).not.toHaveBeenCalled();
        })

        it('busca los match del reporte actual antes de actualizar', async () => {

            const report = makeReport();
            const matchResultsOne = makeMatchResult();
            const matchResultsTwo = makeMatchResultRaw({ candidate_report_id: 3, score: 0.8 });

            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
            (matchRepository.findMatchResults as ReturnType<typeof vi.fn>).mockResolvedValue([matchResultsOne, matchResultsTwo]);

            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);

            await useCase.execute(2, LOST_TYPE, []);

            expect(matchRepository.findMatchResults).toHaveBeenCalledWith(report.reportId);

        })

        it('busca los candidatos', async () => {
            const report = makeReport({ details: { hasIdIdentification: true, breed: "Otro", size: "MALE", } });

            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(report);
            const candidates = [
                makeReport({ reportId: 3 }),
                makeReport({ reportId: 4 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);
            await useCase.execute(2, LOST_TYPE, [DataChangeType.IMAGE]);

            expect(reportRepo.findCandidatesReportsActives).toHaveBeenCalledWith(report.reportId, LOST_TYPE, report.details, report.location);

        })

        it("guardar los nuevos matcheos", async () => {

            const reportNow = makeReport();
            (reportRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(reportNow);

            const reportOne = makeReport({ reportId: 3, details: { hasIdIdentification: true, breed: "Otro", size: "MALE", } });
            const reportTwo = makeReport({ reportId: 4, details: { hasIdIdentification: true, breed: "Otro", size: "MALE", } });

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>).mockResolvedValue([reportOne, reportTwo]);

            const rankingResults = [
                makeMatchResultRaw({ candidate_report_id: 3, score: 0.95 }),
                makeMatchResultRaw({ candidate_report_id: 4, score: 0.82 }),
            ];

            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);

            await useCase.execute(2, LOST_TYPE, []);

            expect(reportRepo.findById).toHaveBeenCalledWith(reportNow.reportId);
            expect(matchingService.rankCandidates).toHaveBeenCalledWith(
                reportNow,
                [reportOne, reportTwo]
            );

            expect(reportRepo.saveMatchResults).toHaveBeenCalledWith(
                reportNow.reportId,
                rankingResults
            );


        })

        it('notifica cuando encuentra un match fuerte nuevo', async () => {

            const report = makeReport();

            (reportRepo.findById as ReturnType<typeof vi.fn>)
                .mockResolvedValue(report);


            // No existen matches anteriores
            (matchRepository.findMatchResults as ReturnType<typeof vi.fn>)
                .mockResolvedValue([]);


            const candidates = [
                makeReport({ reportId: 3 }),
            ];

            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue(candidates);

            const rankingResults = [
                makeMatchResult({
                    reportId: 3,
                    score: MATCH_NOTIFICATION_THRESHOLD + 0.1,
                }),
            ];


            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);



            const notification = {
                id: 1,
                userId: 10,
            };


            (reportRepo.findMatchNotifications as ReturnType<typeof vi.fn>)
                .mockResolvedValue([notification]);


            await useCase.execute(2, LOST_TYPE, []);



            expect(reportRepo.findMatchNotifications)
                .toHaveBeenCalledWith(
                    report.reportId,
                    [3]
                );


            expect(matchNotifier.publish)
                .toHaveBeenCalledWith(notification);

        });

        it('no notifica cuando el match tiene score menor al threshold', async () => {

            const report = makeReport();

            (reportRepo.findById as ReturnType<typeof vi.fn>)
                .mockResolvedValue(report);


            (matchRepository.findMatchResults as ReturnType<typeof vi.fn>)
                .mockResolvedValue([]);


            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    makeReport({ reportId: 3 })
                ]);


            const rankingResults = [
                makeMatchResult({
                    reportId: 3,
                    score: MATCH_NOTIFICATION_THRESHOLD - 0.1,
                }),
            ];


            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);



            await useCase.execute(2, LOST_TYPE, []);



            expect(reportRepo.findMatchNotifications)
                .not.toHaveBeenCalled();


            expect(matchNotifier.publish)
                .not.toHaveBeenCalled();

        });

        it('notifica cuando el match mejora el score suficiente', async () => {

            const report = makeReport();


            (reportRepo.findById as ReturnType<typeof vi.fn>)
                .mockResolvedValue(report);

            const oldMatch = makeMatchResultRaw({
                source_report_id: 2,
                candidate_report_id: 3,
                score: 0.80,
            });


            (matchRepository.findMatchResults as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    oldMatch
                ]);



            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    makeReport({ reportId: 3 })
                ]);

            const rankingResults = [
                makeMatchResult({
                    reportId: 3,
                    score: 0.90,
                }),
            ];


            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);



            const notification = {
                id: 1,
                userId: 10,
            };


            (reportRepo.findMatchNotifications as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    notification
                ]);



            await useCase.execute(2, LOST_TYPE, []);



            expect(reportRepo.findMatchNotifications)
                .toHaveBeenCalledWith(
                    report.reportId,
                    [3]
                );


            expect(matchNotifier.publish)
                .toHaveBeenCalledWith(notification);

        });

        it('no notifica cuando el score mejora pero no supera el mínimo requerido', async () => {

            const report = makeReport();


            (reportRepo.findById as ReturnType<typeof vi.fn>)
                .mockResolvedValue(report);



            const oldMatch = makeMatchResultRaw({
                source_report_id: 2,
                candidate_report_id: 3,
                score: 0.80,
            });


            (matchRepository.findMatchResults as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    oldMatch
                ]);



            (reportRepo.findCandidatesReportsActives as ReturnType<typeof vi.fn>)
                .mockResolvedValue([
                    makeReport({ reportId: 3 })
                ]);



            const rankingResults = [
                makeMatchResult({
                    reportId: 3,
                    score: 0.82,
                }),
            ];



            (matchingService.rankCandidates as ReturnType<typeof vi.fn>)
                .mockReturnValue(rankingResults);



            await useCase.execute(2, LOST_TYPE, []);



            expect(reportRepo.findMatchNotifications)
                .not.toHaveBeenCalled();


            expect(matchNotifier.publish)
                .not.toHaveBeenCalled();

        });
    })

})