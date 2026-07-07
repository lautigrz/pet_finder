
import { setupTestDatabase, type TestDatabase } from "@pet-alert/shared/testing";

let db: TestDatabase;

export async function setup(project: any) {
    db = await setupTestDatabase();
    project.provide("testDatabaseUrl", db.container.getConnectionUri());
}

export async function teardown() {
    await db.prisma.$disconnect();
    await db.container.stop();
}