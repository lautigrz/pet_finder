import { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import { IPushSender } from "../../../domain/services/IPushSender";
import { SendPushToUserInput } from "./send-push-to-user.input";

export class SendPushToUserUseCase {
    constructor(
        private readonly deviceTokenRepository: IDeviceTokenRepository,
        private readonly pushSender: IPushSender,
    ) { }

    async execute(input: SendPushToUserInput): Promise<void> {
        const tokens = await this.deviceTokenRepository.findTokensByUser(input.userPublicId);
        if (tokens.length === 0) return;
        await this.pushSender.send(tokens, input.notification);
    }
}
