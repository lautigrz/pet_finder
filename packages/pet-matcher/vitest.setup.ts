import { inject } from "vitest";

const url = inject("testDatabaseUrl");
if (url) {
    process.env.DATABASE_URL = url;
}
