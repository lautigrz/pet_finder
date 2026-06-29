import { Job, Worker } from "bullmq";
import { redisConnection } from "../infrastructure/redis/redis.client";
import * as dotenv from 'dotenv';
import { logger } from "@pet-alert/shared";
import { MatchingJobData } from "@pet-alert/shared";
import { RunMatchingUseCase } from "../application/use-cases/run-matching.use-case";
import { PrismaReportRepository } from "../infrastructure/repositories/prisma-report.repository";
import { PrismaPetRepository } from "../infrastructure/repositories/prisma-pet.repository";
import { MatchingDomainService } from "../domain/services/matching.domain-service";
import { RedisMatchNotifier } from "../infrastructure/notifications/redis-match-notifier";
import { redisPublisher } from "../infrastructure/redis/redis.publisher";
import { RefreshMatchingUseCase } from "@application/use-cases/refresh-matching.use-case";
import { MatchRepository } from "@infrastructure/repositories/match.repository";
import prisma from "@infrastructure/prisma/prisma.client";
dotenv.config();


const reportRepository = new PrismaReportRepository();
const petRepository = new PrismaPetRepository();
const matchingDomainService = new MatchingDomainService();
const matchNotifier = new RedisMatchNotifier(redisPublisher);
const matchRepository = new MatchRepository(prisma);
const runMatchingUseCase = new RunMatchingUseCase(reportRepository, petRepository, matchingDomainService, matchNotifier);
const runRefreshMatchingUseCase = new RefreshMatchingUseCase(reportRepository, petRepository, matchRepository, matchingDomainService, matchNotifier);

export const matchingWorker = new Worker<MatchingJobData>(
  "animal-matching",

  async (job: Job<MatchingJobData>) => {
    logger.info(job.data.reportId);

    switch (job.data.type) {
      case 'run_matching': {
        logger.info(`Processing ${job.data.type} job for report ${job.data.reportId}`);
        const results = await runMatchingUseCase.execute(job.data.reportId, job.data.reportType);
        logger.info(`Matching completed for report ${job.data.reportId}: ${results.length} candidates ranked`);
        return results;
      }
      case 'refresh_matching': {
        logger.info(`Processing ${job.data.type} job for report ${job.data.reportId}`);

        const results = await runRefreshMatchingUseCase.execute(job.data.reportId, job.data.reportType, job.data.changes!);
        logger.info(`Refresh matching completed for report ${job.data.reportId}: ${results.length} candidates ranked`);
        return results;
      }
      default:
        logger.error(`Unknown job type: ${(job.data as any).type}`);
    }
  },

  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 300_000,
    lockRenewTime: 150_000,
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
);