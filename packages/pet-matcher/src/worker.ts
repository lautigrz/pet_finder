
import { warmupDescriptionModel } from "./services/embedding-description-services";
import { warmupModel } from "./services/embedding-images-services";
import { logger } from "@pet-alert/shared";
import { ensureModelsExist } from "./infrastructure/repositories/utils/ensure.models";
logger.info("Starting embedding worker...");

async function main() {
  await ensureModelsExist();
  await warmupModel();
  await warmupDescriptionModel();

  const { matchingWorker } = await import("./worker/embedding.worker");

  matchingWorker.on("ready", () => {
    logger.info("Worker ready");
  });

  matchingWorker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  matchingWorker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed`, err);
  });

  process.on("SIGINT", async () => {
    logger.info("Shutting down worker...");

    await matchingWorker.close();

    process.exit(0);
  });
}

main().catch(err => {
  logger.error("Fatal error during startup", err);
  process.exit(1);
});