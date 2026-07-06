import "reflect-metadata";

process.env.JWT_SECRET ??= "test-jwt-secret-no-real-secret-only-for-vitest-runtime";
process.env.JWT_ACCESS_TTL ??= "15m";
process.env.JWT_REFRESH_TTL ??= "7d";

process.env.MP_ACCESS_TOKEN ??= "test-mp-access-token";
process.env.MP_WEBHOOK_SECRET ??= "test-mp-webhook-secret";
process.env.PUBLIC_API_URL ??= "http://localhost:3000";
process.env.APP_BASE_URL ??= "http://localhost:4200";
process.env.FEATURED_PRICE ??= "1500";
