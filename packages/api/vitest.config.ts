// packages/api/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@domain": path.resolve(__dirname, "src/domain"),
            "@application": path.resolve(__dirname, "src/application"),
            "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
            "src": path.resolve(__dirname, "src"),
        },
    },
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            reportsDirectory: "coverage",
        },
        include: ["src/**/*.test.ts", "e2e/**/*.test.ts"],
    },
});