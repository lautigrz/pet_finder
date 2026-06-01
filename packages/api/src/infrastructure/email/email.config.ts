import { z } from "zod";

const emailEnvSchema = z
  .object({
    EMAIL_PROVIDER: z.enum(["log", "gmail"]).default("log"),
    GMAIL_USER: z.string().min(1).optional(),
    GMAIL_APP_PASSWORD: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    APP_BASE_URL: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_PROVIDER !== "gmail") return;
    const required = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "EMAIL_FROM", "APP_BASE_URL"] as const;
    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when EMAIL_PROVIDER=gmail`,
        });
      }
    }
  });

export interface EmailConfig {
  provider: "log" | "gmail";
  gmailUser?: string;
  gmailAppPassword?: string;
  from?: string;
  appBaseUrl?: string;
}

export function readEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const parsed = emailEnvSchema.parse({
    EMAIL_PROVIDER: env.EMAIL_PROVIDER,
    GMAIL_USER: env.GMAIL_USER,
    GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD,
    EMAIL_FROM: env.EMAIL_FROM,
    APP_BASE_URL: env.APP_BASE_URL,
  });
  return {
    provider: parsed.EMAIL_PROVIDER,
    gmailUser: parsed.GMAIL_USER,
    gmailAppPassword: parsed.GMAIL_APP_PASSWORD,
    from: parsed.EMAIL_FROM,
    appBaseUrl: parsed.APP_BASE_URL,
  };
}
