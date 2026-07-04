import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { NotifyAppealResultInput } from "./notify-appeal-result.input";

@injectable()
export class NotifyAppealResultUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
    ) { }

    async execute(input: NotifyAppealResultInput): Promise<void> {
        const appellant = await this.userRepository.findById(input.appellantUserId);
        if (!appellant) return;
        await this.notify(appellant.email, input);
    }

    private async notify(email: string, input: NotifyAppealResultInput): Promise<void> {
        if (input.accepted) {
            await this.emailService.sendAppealAcceptedNotice(email, input.targetType);
            return;
        }
        await this.emailService.sendAppealRejectedNotice(email, input.targetType);
    }
}
