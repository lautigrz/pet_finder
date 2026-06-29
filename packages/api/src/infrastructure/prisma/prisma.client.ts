import dotenv from "dotenv";
import { container } from "tsyringe";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();
container.registerInstance<PrismaClient>("PrismaClient", prisma);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;