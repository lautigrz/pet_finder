import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import type { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import type { PaymentConfig } from "@application/ports/PaymentConfig";
import { Payment } from "@domain/payment/aggregates/PaymentAggregate";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { UnauthorizedFeatureReportError } from "@domain/payment/errors/UnauthorizedFeatureReportError";
import { ReportAlreadyFeaturedError } from "@domain/payment/errors/ReportAlreadyFeaturedError";
import { CreateFeaturedPreferenceInput, CreateFeaturedPreferenceOutput } from "./dto/create-featured-preference.dto";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateFeaturedPreferenceUseCase {
    constructor(
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("PaymentRepository")
        private readonly paymentRepository: PaymentRepository,
        @inject("PaymentGateway")
        private readonly paymentGateway: PaymentGateway,
        @inject("PaymentConfig")
        private readonly config: PaymentConfig,
    ) { }

    async execute(input: CreateFeaturedPreferenceInput): Promise<CreateFeaturedPreferenceOutput> {
        const report = await this.reportRepository.findByPublicId(input.reportPublicId);
        if (!report || report.idReport === null) {
            throw new ReportNotFoundError(input.reportPublicId);
        }

        if (report.userPublicId !== input.userPublicId) {
            throw new UnauthorizedFeatureReportError();
        }

        if (report.isFeaturedActive()) {
            throw new ReportAlreadyFeaturedError(input.reportPublicId);
        }

        const payment = Payment.create({
            reportId: report.idReport,
            userId: report.userId,
            amount: this.config.featuredPrice,
            currency: this.config.currency,
        });

        const preference = await this.paymentGateway.createPreference({
            externalReference: payment.publicId,
            title: "Reporte destacado - PetFinder",
            quantity: 1,
            unitPrice: this.config.featuredPrice,
            currency: this.config.currency,
            backUrls: {
                success: `${this.config.frontendBaseUrl}/reports/${report.publicId}/destacar/exito`,
                failure: `${this.config.frontendBaseUrl}/reports/${report.publicId}/destacar/error`,
                pending: `${this.config.frontendBaseUrl}/reports/${report.publicId}/destacar/pendiente`,
            },
            notificationUrl: this.config.notificationUrl,
        });

        payment.attachPreference(preference.preferenceId);
        await this.paymentRepository.save(payment);

        return { initPoint: preference.initPoint };
    }
}
