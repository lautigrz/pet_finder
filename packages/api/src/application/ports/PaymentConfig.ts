export interface PaymentConfig {
  featuredPrice: number;
  currency: string;
  frontendBaseUrl: string;
  notificationUrl: string;
  validateWebhookSignature: boolean;
}
