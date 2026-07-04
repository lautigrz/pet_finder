import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import type { IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { NotifyOwnerOfContentSentenceInput } from "./notify-owner-of-content-sentence.input";

@injectable()
export class NotifyOwnerOfContentSentenceUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
        @inject("AppealTokenSigner")
        private readonly appealTokenSigner: IAppealTokenSigner,
    ) { }

    async execute(input: NotifyOwnerOfContentSentenceInput): Promise<void> {
        const owner = await this.userRepository.findByPublicId(input.ownerPublicId);
        if (!owner) return;
        await this.notify(owner.email, input, this.buildAppealToken(input));
    }

    private buildAppealToken(input: NotifyOwnerOfContentSentenceInput): string {
        const targetType = input.kind === "ACCOUNT_SUSPENDED" ? AppealTargetType.ACCOUNT : AppealTargetType.POST;
        return this.appealTokenSigner.sign({
            targetType,
            targetPublicId: input.targetPublicId,
            appellantPublicId: input.ownerPublicId,
        });
    }

    private async notify(email: string, input: NotifyOwnerOfContentSentenceInput, appealToken: string): Promise<void> {
        if (input.kind === "ACCOUNT_SUSPENDED") {
            await this.emailService.sendAccountSuspendedNotice(email, input.motive, appealToken);
            return;
        }
        await this.emailService.sendPublicationRemovedNotice(email, appealToken);
    }
}
