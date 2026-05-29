// packages/api/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
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