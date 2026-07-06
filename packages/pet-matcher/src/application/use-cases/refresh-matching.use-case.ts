import { MatchResult } from "@domain/entities/match-result.entity";
import { ReportEntity } from "@domain/entities/report.entity";
import { IMatchRepository, MatchResultRaw } from "@domain/repositories/match.repository";
import { IPetRepository } from "@domain/repositories/pet.repository";
import { IReportRepository } from "@domain/repositories/report.repository";
import { IMatchNotifier } from "@domain/services/match-notifier";
import { MatchingDomainService } from "@domain/services/matching.domain-service";
import { ReportType } from "@infrastructure/repositories/types/report-type";
import { DataChangeType, logger, MATCH_NOTIFICATION_THRESHOLD } from '@pet-alert/shared';
import { extractDescriptionEmbedding } from "@services/embedding-description-services";
import { extractEmbedding } from "@services/embedding-images-services";


export class RefreshMatchingUseCase {

    private static readonly SCORE_IMPROVEMENT_THRESHOLD = 0.05;

    constructor(
        private readonly reportRepository: IReportRepository,
        private readonly petRepository: IPetRepository,
        private readonly matchRepository: IMatchRepository,
        private readonly matchingService: MatchingDomainService,
        private readonly matchNotifier: IMatchNotifier,
    ) { }

    async execute(reportId: number, reportType: number, changes: DataChangeType[]): Promise<MatchResult[]> {
        logger.info(`[RefreshMatchingUseCase] Starting matching for report ${reportId}`);
        const t0 = performance.now();
        const report = await this.reportRepository.findById(reportId);
        logger.info(`[findById] inference took ${(performance.now() - t0).toFixed(0)}ms`);

        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }

        if (changes.includes(DataChangeType.IMAGE)) {
            const t0 = performance.now();
            await this.processImages(report, reportType);
            logger.info(`[DINOv2] inference took ${(performance.now() - t0).toFixed(0)}ms`);
        }

        if (changes.includes(DataChangeType.DESCRIPTION)) {
            const t1 = performance.now();
            await this.processDescription(report, reportId);
            logger.info(`[E5-Small] inference took ${(performance.now() - t1).toFixed(0)}ms`);
        }


        const oldMatchs = await this.matchRepository.findMatchResults(reportId);


        const t2 = performance.now();
        const candidates = await this.reportRepository.findCandidatesReportsActives(report.reportId, report.reportTypeId, report.details, report.location);
        logger.info(`[findCandidatesReportsActives] inference took ${(performance.now() - t2).toFixed(0)}ms`);

        const t3 = performance.now();
        const results = this.matchingService.rankCandidates(report, candidates);
        logger.info(`[ranking] inference took ${(performance.now() - t3).toFixed(0)}ms`);

        const t4 = performance.now();
        await this.reportRepository.saveMatchResults(report.reportId, results);
        logger.info(`[saveMatchResults] inference took ${(performance.now() - t4).toFixed(0)}ms`);

        logger.info(`[RunMatchingUseCase] ${results.length} candidates ranked for report ${reportId} - total time: ${(performance.now() - t0).toFixed(0)}ms`);

        await this.notifyStrongMatches(report.reportId, results, oldMatchs);
        return results;
    }
    private async notifyStrongMatches(
        sourceReportId: number,
        results: MatchResult[],
        oldMatches: MatchResultRaw[],
    ): Promise<void> {
        try {
            const oldMatchesMap = new Map(
                oldMatches.map(match => {
                    const candidateId = match.source_report_id === sourceReportId
                        ? match.candidate_report_id
                        : match.source_report_id;
                    return [candidateId, match.score];
                }),
            );

            const candidateIdsToNotify = results
                .filter(result => {
                    if (result.score < MATCH_NOTIFICATION_THRESHOLD) {
                        return false;
                    }

                    const previousScore = oldMatchesMap.get(result.reportId);

                    if (previousScore === undefined) {
                        return true;
                    }

                    return (
                        result.score - previousScore >=
                        RefreshMatchingUseCase.SCORE_IMPROVEMENT_THRESHOLD
                    );
                })
                .map(result => result.reportId);

            if (candidateIdsToNotify.length === 0) {
                return;
            }

            const notifications =
                await this.reportRepository.findMatchNotifications(
                    sourceReportId,
                    candidateIdsToNotify,
                );

            await Promise.all(
                notifications.map(notification =>
                    this.matchNotifier.publish(notification),
                ),
            );
        } catch (err) {
            logger.error(
                `[RunMatchingUseCase] Failed to publish match notifications for report ${sourceReportId}: ${err}`,
            );
        }
    }

    private async processDescription(report: ReportEntity, reportId: number) {
        if (report.description) {
            logger.info(`[RunMatchingUseCase] Computing description embedding for report ${reportId}`);
            const embedding = await extractDescriptionEmbedding(report.description);
            if (!embedding) {
                logger.warn(`[RunMatchingUseCase] Failed to compute description embedding for report ${reportId}`);
                throw new Error("No description embedding returned for description")
            }
            report.embeddingDescription = embedding;
            await this.reportRepository.updateDescriptionEmbedding(report.reportId, embedding);
        }
    }

    private async processImages(report: ReportEntity, reportType: number) {

        const results = await Promise.allSettled(report.images.filter(img => !img.embeddingPhoto)
            .map(async (image) => {
                const buffer = await fetch(image.photoUrl).then(r => r.arrayBuffer()).then(Buffer.from);
                const embedding = await extractEmbedding(buffer);
                if (!embedding) {
                    logger.warn(`[processImages] extractEmbedding returned null for image ${image.imageId}`);
                    throw new Error(`No embedding returned for image ${image.imageId}`);
                }
                image.embeddingPhoto = embedding
                await this.updateImageEmbeddings(reportType, image.imageId, embedding)
            }));

        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            logger.error(`[RunMatchingUseCase] Failed to process ${failed.length} images for report ${report.reportId}`);
            throw new Error(`Failed to process ${failed.length} image embeddings`);
        }
    }



    private async updateImageEmbeddings(reportType: number, imageId: number, embeddings: number[]) {

        if (reportType === ReportType.LOST) {
            await this.petRepository.updateImageEmbedding(imageId, embeddings);
        } else {
            await this.reportRepository.updateImageEmbedding(imageId, embeddings);
        }


    }

}