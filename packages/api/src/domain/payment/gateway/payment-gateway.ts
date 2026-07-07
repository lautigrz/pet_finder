export interface CreatePreferenceInput {
  externalReference: string;
  title: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl: string;
}

export interface CreatePreferenceResult {
  preferenceId: string;
  initPoint: string;
}

export interface PaymentDetails {
  mpPaymentId: string;
  status: string;
  externalReference: string | null;
  approvedAt: Date | null;
}

export interface WebhookSignatureParams {
  dataId: string;
  xSignature: string | undefined;
  xRequestId: string | undefined;
}

export interface PaymentGateway {

  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult>;

  getPayment(mpPaymentId: string): Promise<PaymentDetails>;

  verifySignature(params: WebhookSignatureParams): boolean;
}
