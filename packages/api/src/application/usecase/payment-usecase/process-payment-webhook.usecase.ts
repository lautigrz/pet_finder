import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import type { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import type { PaymentConfig } from "@application/ports/PaymentConfig";
import { PaymentNotFoundError } from "@domain/payment/errors/PaymentNotFoundError";
import { InvalidWebhookSignatureError } from "@domain/payment/errors/InvalidWebhookSignatureError";
import { ProcessPaymentWebhookInput } from "./dto/process-payment-webhook.dto";
import { NotifyFeaturedPaymentUseCase } from "../notify-featured-payment/notify-featured-payment.usecase";
import { logger } from "@pet-alert/shared";
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
        @inject("NotifyFeaturedPaymentUseCase")
        private readonly notifyFeaturedPayment: NotifyFeaturedPaymentUseCase,
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

            try {
                await this.notifyFeaturedPayment.execute({
                    userId: payment.userId,
                    reportId: payment.reportId,
                    amount: payment.amount,
                    currency: payment.currency,
                    operationId: details.mpPaymentId,
                });
            } catch (error) {
                logger.warn(`No se pudo enviar el comprobante de pago del reporte ${payment.reportId}: ${error instanceof Error ? error.message : String(error)}`);
            }
            return;
        }

        if (details.status === "rejected" || details.status === "cancelled") {
            payment.reject(details.mpPaymentId);
            await this.paymentRepository.update(payment);
        }
    }
}
