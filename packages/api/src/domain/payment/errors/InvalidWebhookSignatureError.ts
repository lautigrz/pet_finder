import { DomainError } from "@domain/errors/DomainError";

export class InvalidWebhookSignatureError extends DomainError {
  constructor() {
    super("Invalid Mercado Pago webhook signature", "INVALID_WEBHOOK_SIGNATURE");
  }
}
