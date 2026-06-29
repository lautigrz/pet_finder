import { z } from "zod";

const pushEnvSchema = z
  .object({
    PUSH_PROVIDER: z.enum(["log", "fcm"]).default("log"),
    FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.PUSH_PROVIDER !== "fcm") return;
    if (!env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      ctx.addIssue({
        code: "custom",
        path: ["FIREBASE_SERVICE_ACCOUNT_BASE64"],
        message: "FIREBASE_SERVICE_ACCOUNT_BASE64 is required when PUSH_PROVIDER=fcm",
      });
    }
  });

export interface PushConfig {
  provider: "log" | "fcm";
  serviceAccountBase64?: string;
}

export function readPushConfig(env: NodeJS.ProcessEnv = process.env): PushConfig {
  const parsed = pushEnvSchema.parse({
    PUSH_PROVIDER: env.PUSH_PROVIDER,
    FIREBASE_SERVICE_ACCOUNT_BASE64: env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  });
  return {
    provider: parsed.PUSH_PROVIDER,
    serviceAccountBase64: parsed.FIREBASE_SERVICE_ACCOUNT_BASE64,
  };
}
