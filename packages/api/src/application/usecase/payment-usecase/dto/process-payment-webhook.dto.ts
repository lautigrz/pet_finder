export interface ProcessPaymentWebhookInput {
  type: string;
  dataId: string;
  xSignature: string | undefined;
  xRequestId: string | undefined;
}
