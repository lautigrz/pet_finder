import { PaymentConfig } from "@application/ports/PaymentConfig";

export interface MercadoPagoCredentials {
  accessToken: string;
  webhookSecret: string;
}

export function readPaymentConfig(): PaymentConfig {
  return {
    featuredPrice: parseNumber("FEATURED_PRICE"),
    currency: process.env.FEATURED_CURRENCY ?? "ARS",
    frontendBaseUrl: required("APP_BASE_URL"),
    notificationUrl: `${required("PUBLIC_API_URL")}/api/payments/webhook`,
    validateWebhookSignature: process.env.MP_VALIDATE_WEBHOOK_SIGNATURE !== "false",
  };
}

export function readMercadoPagoCredentials(): MercadoPagoCredentials {
  return {
    accessToken: required("MP_ACCESS_TOKEN"),
    webhookSecret: required("MP_WEBHOOK_SECRET"),
  };
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

function parseNumber(key: string): number {
  const value = Number(required(key));
  if (Number.isNaN(value)) throw new Error(`Invalid number for env var: ${key}`);
  return value;
}
