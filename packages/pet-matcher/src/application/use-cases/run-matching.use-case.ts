import { logger, MATCH_NOTIFICATION_THRESHOLD } from '@pet-alert/shared';
import { MatchResult } from '@domain/entities/match-result.entity';
import { IPetRepository } from '@domain/repositories/pet.repository';
import { IReportRepository } from '@domain/repositories/report.repository';
import { MatchingDomainService } from '@domain/services/matching.domain-service';
import { extractEmbedding } from '@services/embedding-images-services';
import { extractDescriptionEmbedding } from '@services/embedding-description-services';
import { ReportType } from '@infrastructure/repositories/types/report-type';
import { ReportEntity } from '@domain/entities/report.entity';
import { IMatchNotifier } from '@domain/services/match-notifier';

export class RunMatchingUseCase {
  constructor(
    private readonly reportRepository: IReportRepository,
    private readonly petRepository: IPetRepository,
    private readonly matchingService: MatchingDomainService,
    private readonly matchNotifier: IMatchNotifier,
  ) { }

  async execute(reportId: number, reportType: number): Promise<MatchResult[]> {
    logger.info(`[RunMatchingUseCase] Starting matching for report ${reportId}`);

    try {
      const report = await this.reportRepository.findById(reportId);
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      const t0 = performance.now();
      await this.processImages(report, reportType);
      logger.info(`[DINOv2] inference took ${(performance.now() - t0).toFixed(0)}ms`);

      const t1 = performance.now();
      await this.processDescription(report, reportId);
      logger.info(`[E5-Small] inference took ${(performance.now() - t1).toFixed(0)}ms`);

      const t2 = performance.now();
      const candidates = await this.reportRepository.findCandidatesReportsActives(report.reportId, report.details, report.location);
      logger.info(`[findCandidatesReportsActives] inference took ${(performance.now() - t2).toFixed(0)}ms`);

      const t3 = performance.now();
      const results = this.matchingService.rankCandidates(report, candidates);
      logger.info(`[ranking] inference took ${(performance.now() - t3).toFixed(0)}ms`);

      const t4 = performance.now();
      await this.reportRepository.saveMatchResults(report.reportId, results);
      logger.info(`[saveMatchResults] inference took ${(performance.now() - t4).toFixed(0)}ms`);

      logger.info(`[RunMatchingUseCase] ${results.length} candidates ranked for report ${reportId} - total time: ${(performance.now() - t0).toFixed(0)}ms`);

      await this.notifyStrongMatches(report.reportId, results);

      return results;
    } catch (err) {
      logger.error(`[RunMatchingUseCase] Fatal error processing report ${reportId} (type=${reportType}): ${err}`);
      throw err;
    }
  }



  private async notifyStrongMatches(sourceReportId: number, results: MatchResult[]): Promise<void> {
    try {
      const strong = results.filter(r => r.score >= MATCH_NOTIFICATION_THRESHOLD);
      if (strong.length === 0) return;

      const notifications = await this.reportRepository.findMatchNotifications(
        sourceReportId,
        strong.map(r => r.reportId),
      );

      for (const notification of notifications) {
        await this.matchNotifier.publish(notification);
      }
    } catch (err) {
      logger.error(`[RunMatchingUseCase] Failed to publish match notifications for report ${sourceReportId}: ${err}`);
    }
  }

  private async processDescription(report: ReportEntity, reportId: number) {
    if (!report.embeddingDescription && report.description) {
      logger.info(`[RunMatchingUseCase] Computing description embedding for report ${reportId}`);
      const embedding = await extractDescriptionEmbedding(report.description);
      if (embedding) {
        report.embeddingDescription = embedding;
        await this.reportRepository.updateDescriptionEmbedding(report.reportId, embedding);
      }
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
        if (!embedding) {
          logger.warn(`[processImages] extractEmbedding returned null for image ${image.imageId}`);
          throw new Error(`No embedding returned for image ${image.imageId}`);
        }

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
