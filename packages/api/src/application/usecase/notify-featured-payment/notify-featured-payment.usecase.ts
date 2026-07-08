import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IEmailService } from "../../../domain/services/IEmailService";
import { NotifyFeaturedPaymentInput } from "./notify-featured-payment.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotifyFeaturedPaymentUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
    ) { }

    async execute(input: NotifyFeaturedPaymentInput): Promise<void> {
        const owner = await this.userRepository.findById(input.userId);
        if (!owner) return;

        const [detail] = await this.reportRepository.findDetailsByIds([input.reportId]);
        if (!detail) return;

        await this.emailService.sendFeaturedPaymentReceipt(
            owner.email,
            input.amount,
            input.currency,
            input.operationId,
            detail.report.publicId,
        );
    }
}
