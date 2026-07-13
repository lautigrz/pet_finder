import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";

@injectable()
export class NotifyAdminsOfFlaggedContentUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
    ) { }

    async execute(targetType: ContentReportTargetType): Promise<void> {
        const adminEmails = await this.userRepository.findAdminEmails();

        await Promise.all(
            adminEmails.map((email) => this.emailService.sendContentFlaggedAlert(email, targetType)),
        );
    }
}
