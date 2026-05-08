import { Queue } from "bullmq";
import { redisConnection } from "../redis/redis.client";

export const embeddingQueue = new Queue("embedding", {
    connection: redisConnection,
});


export async function enqueueMatchingJob(data: any) {
    await embeddingQueue.add("matching-job", data);
}