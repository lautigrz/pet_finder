import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { NotifyOwnerOfContentSentenceInput } from "./notify-owner-of-content-sentence.input";

@injectable()
export class NotifyOwnerOfContentSentenceUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
    ) { }

    async execute(input: NotifyOwnerOfContentSentenceInput): Promise<void> {
        const owner = await this.userRepository.findByPublicId(input.ownerPublicId);
        if (!owner) return;
        await this.notify(owner.email, input);
    }

    private async notify(email: string, input: NotifyOwnerOfContentSentenceInput): Promise<void> {
        if (input.kind === "ACCOUNT_SUSPENDED") {
            await this.emailService.sendAccountSuspendedNotice(email, input.motive);
            return;
        }
        await this.emailService.sendPublicationRemovedNotice(email);
    }
}
