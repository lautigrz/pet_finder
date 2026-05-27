process.env.JWT_SECRET ??= "test-jwt-secret-no-real-secret-only-for-vitest-runtime";
process.env.JWT_ACCESS_TTL ??= "15m";
process.env.JWT_REFRESH_TTL ??= "7d";
