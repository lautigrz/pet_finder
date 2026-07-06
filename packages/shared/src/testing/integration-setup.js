"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestDatabase = setupTestDatabase;
exports.truncateAll = truncateAll;
const postgresql_1 = require("@testcontainers/postgresql");
const child_process_1 = require("child_process");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const SCHEMA_PATH = path_1.default.resolve(__dirname, "../../prisma/schema.prisma");
const SEED_PATH = path_1.default.resolve(__dirname, "../../prisma/seed.ts");
async function setupTestDatabase() {
    const container = await new postgresql_1.PostgreSqlContainer("pet-alert-postgres:latest").start();
    console.log("TEST CONTAINER:", container.getId());
    const databaseUrl = container.getConnectionUri();
    (0, child_process_1.execSync)(`npx prisma migrate deploy --schema=${SCHEMA_PATH}`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });
    (0, child_process_1.execSync)(`npx tsx ${SEED_PATH}`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });
    const prisma = new client_1.PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
    return { prisma, container };
}
/**
 * Truncates all mutable data tables by running DELETE FROM statements in the order
 * of foreign key dependency.
 * This is 10x-100x faster than TRUNCATE CASCADE in PostgreSQL because it does not
 * incur filesystem lock and fsync metadata operations for every table.
 */
async function truncateAll(prisma) {
    const tables = [
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
    // Delete rows sequentially from child to parent tables to respect foreign keys
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    }
}
//# sourceMappingURL=integration-setup.js.map