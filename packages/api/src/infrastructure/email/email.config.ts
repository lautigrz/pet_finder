import { z } from "zod";

const requiredByProvider = {
  gmail: ["GMAIL_USER", "GMAIL_APP_PASSWORD", "EMAIL_FROM", "APP_BASE_URL"],
  sendgrid: ["SENDGRID_API_KEY", "EMAIL_FROM", "APP_BASE_URL"],
} as const;

const emailEnvSchema = z
  .object({
    EMAIL_PROVIDER: z.enum(["log", "gmail", "sendgrid"]).default("log"),
    GMAIL_USER: z.string().min(1).optional(),
    GMAIL_APP_PASSWORD: z.string().min(1).optional(),
    SENDGRID_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    APP_BASE_URL: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    const required = requiredByProvider[env.EMAIL_PROVIDER as keyof typeof requiredByProvider];
    if (!required) return;
    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when EMAIL_PROVIDER=${env.EMAIL_PROVIDER}`,
        });
      }
    }
  });

export interface EmailConfig {
  provider: "log" | "gmail" | "sendgrid";
  gmailUser?: string;
  gmailAppPassword?: string;
  sendgridApiKey?: string;
  from?: string;
  appBaseUrl?: string;
}

export function readEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const parsed = emailEnvSchema.parse({
    EMAIL_PROVIDER: env.EMAIL_PROVIDER,
    GMAIL_USER: env.GMAIL_USER,
    GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD,
    SENDGRID_API_KEY: env.SENDGRID_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    APP_BASE_URL: env.APP_BASE_URL,
  });
  return {
    provider: parsed.EMAIL_PROVIDER,
    gmailUser: parsed.GMAIL_USER,
    gmailAppPassword: parsed.GMAIL_APP_PASSWORD,
    sendgridApiKey: parsed.SENDGRID_API_KEY,
    from: parsed.EMAIL_FROM,
    appBaseUrl: parsed.APP_BASE_URL,
  };
}
