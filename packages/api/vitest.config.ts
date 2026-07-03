
import { defineConfig } from "vitest/config";
import { sharedAlias } from "./vitest.shared";

export default defineConfig({
    resolve: {
        alias: sharedAlias,
    },
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            reportsDirectory: "coverage",
        },
        include: ["src/**/*.test.ts", "e2e/**/*.test.ts"],
        exclude: ["**/*.integration.test.ts"],
    },
});