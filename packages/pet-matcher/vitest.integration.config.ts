
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@domain": path.resolve(__dirname, "src/domain"),
            "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
            "@services": path.resolve(__dirname, "src/services"),
            "@application": path.resolve(__dirname, "src/application"),
            "src": path.resolve(__dirname, "src"),
        },
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
        passWithNoTests: true,
        globalSetup: ["../api/src/global-setup.ts"],
    },
});
