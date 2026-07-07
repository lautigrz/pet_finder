import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
export type TestDatabase = {
    prisma: PrismaClient;
    container: StartedPostgreSqlContainer;
};
export declare function setupTestDatabase(): Promise<TestDatabase>;
/**
 * Truncates all mutable data tables by running DELETE FROM statements in the order
 * of foreign key dependency.
 * This is 10x-100x faster than TRUNCATE CASCADE in PostgreSQL because it does not
 * incur filesystem lock and fsync metadata operations for every table.
 */
export declare function truncateAll(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=integration-setup.d.ts.map