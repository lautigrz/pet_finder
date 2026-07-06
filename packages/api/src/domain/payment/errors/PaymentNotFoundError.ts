import { DomainError } from "@domain/errors/DomainError";

export class PaymentNotFoundError extends DomainError {
  constructor(publicId: string) {
    super(`Payment not found with publicId: ${publicId}`, "PAYMENT_NOT_FOUND");
  }
}
