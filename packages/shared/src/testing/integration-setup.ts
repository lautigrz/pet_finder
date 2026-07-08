import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import path from "path";


export type TestDatabase = {
    prisma: PrismaClient;
    container: StartedPostgreSqlContainer;
};

const SCHEMA_PATH = path.resolve(__dirname, "../../prisma/schema.prisma");
const SEED_PATH = path.resolve(__dirname, "../../prisma/seed.ts");

export async function setupTestDatabase(): Promise<TestDatabase> {

    const container = await new PostgreSqlContainer("pet-alert-postgres:latest").start();
    console.log("TEST CONTAINER:", container.getId());
    const databaseUrl = container.getConnectionUri();

    execSync(`npx prisma migrate deploy --schema=${SCHEMA_PATH}`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });

    execSync(`npx tsx ${SEED_PATH}`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });

    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    return { prisma, container };
}

export async function truncateAll(prisma: PrismaClient): Promise<void> {
    const tables = [
        "appeals",
        "content_reports",
        "message_images",
        "messages",
        "conversations",
        "report_followers",
        "match_views",
        "match_results",
        "report_images",
        "sighting_report_details",
        "lost_report_details",
        "reports",
        "pet_images",
        "pets",
        "device_tokens",
        "notification_preferences",
        "email_verification_tokens",
        "password_reset_tokens",
        "refresh_tokens",
        "users"
    ];

    for (const table of tables) {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    }
}
