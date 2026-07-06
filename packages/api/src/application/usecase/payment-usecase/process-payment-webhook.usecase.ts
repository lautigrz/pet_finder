import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import type { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import type { PaymentConfig } from "@application/ports/PaymentConfig";
import { PaymentNotFoundError } from "@domain/payment/errors/PaymentNotFoundError";
import { InvalidWebhookSignatureError } from "@domain/payment/errors/InvalidWebhookSignatureError";
import { ProcessPaymentWebhookInput } from "./dto/process-payment-webhook.dto";
import { inject, injectable } from "tsyringe";

@injectable()
export class ProcessPaymentWebhookUseCase {
    constructor(
        @inject("PaymentRepository")
        private readonly paymentRepository: PaymentRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("PaymentGateway")
        private readonly paymentGateway: PaymentGateway,
        @inject("PaymentConfig")
        private readonly config: PaymentConfig,
    ) { }

    async execute(input: ProcessPaymentWebhookInput): Promise<void> {
        const isValid = this.paymentGateway.verifySignature({
            dataId: input.dataId,
            xSignature: input.xSignature,
            xRequestId: input.xRequestId,
        });
        if (!isValid && this.config.validateWebhookSignature) {
            throw new InvalidWebhookSignatureError();
        }

        if (input.type !== "payment") return;

        const details = await this.paymentGateway.getPayment(input.dataId);
        if (!details.externalReference) return;

        const payment = await this.paymentRepository.findByPublicId(details.externalReference);
        if (!payment) {
            throw new PaymentNotFoundError(details.externalReference);
        }

        if (payment.isApproved) return;

        if (details.status === "approved") {
            payment.approve(details.mpPaymentId);
            await this.paymentRepository.update(payment);

            await this.reportRepository.markFeatured(payment.reportId);
            return;
        }

        if (details.status === "rejected" || details.status === "cancelled") {
            payment.reject(details.mpPaymentId);
            await this.paymentRepository.update(payment);
        }
    }
}
