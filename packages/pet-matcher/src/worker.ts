import { embeddingWorker } from "./worker/embedding.worker";
console.log("Starting embedding worker...");

embeddingWorker.on("ready", () => {
  console.log("Worker ready");
});

embeddingWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

embeddingWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");

  await embeddingWorker.close();

  process.exit(0);
});