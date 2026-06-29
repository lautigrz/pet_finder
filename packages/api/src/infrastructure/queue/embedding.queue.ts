import type { MatchingJobData, TypeJob } from "@pet-alert/shared";
import { Queue } from "bullmq";

export const matchingQueue = new Queue<MatchingJobData>('animal-matching', {
    connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 1000 }
    }
});

export async function enqueueMatchingJob(data: MatchingJobData) {
    await matchingQueue.add(data.type, data, { delay: 500 });
}