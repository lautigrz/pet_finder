// packages/api/vitest.integration.config.ts
import { defineConfig } from "vitest/config";
import { sharedAlias } from "./vitest.shared";

export default defineConfig({
    resolve: {
        alias: sharedAlias
    },
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
        include: ["src/**/*.integration.test.ts"],
        testTimeout: 60000,
        hookTimeout: 60000,
        pool: "forks",
        fileParallelism: false,
        globalSetup: ["./src/global-setup.ts"],
    },
});