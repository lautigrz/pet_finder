// packages/api/vitest.shared.ts
import path from "path";

export const sharedAlias = {
    "@domain": path.resolve(__dirname, "src/domain"),
    "@application": path.resolve(__dirname, "src/application"),
    "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
    "@presentation": path.resolve(__dirname, "src/presentation"),
    "src": path.resolve(__dirname, "src"),
};