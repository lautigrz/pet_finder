import { Worker } from "bullmq";

import { redisConnection }
  from "../infrastructure/redis/redis.client";
import prisma from "../infrastructure/prisma/prisma.client";

export const embeddingWorker = new Worker(
  "embedding",

  async (job) => {
    console.log(job.name);
    console.log(job.data);

    const a = await prisma.pet.findMany();
    console.log(a);
  },

  {
    connection: redisConnection
  }
);