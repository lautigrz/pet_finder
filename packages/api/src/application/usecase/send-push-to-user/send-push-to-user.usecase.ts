import type { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import type { IPushSender } from "../../../domain/services/IPushSender";
import { SendPushToUserInput } from "./send-push-to-user.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class SendPushToUserUseCase {
    constructor(
        @inject("DeviceTokenRepository")
        private readonly deviceTokenRepository: IDeviceTokenRepository,
        @inject("PushSender")
        private readonly pushSender: IPushSender,
    ) { }

    async execute(input: SendPushToUserInput): Promise<void> {
        const tokens = await this.deviceTokenRepository.findTokensByUser(input.userPublicId);
        if (tokens.length === 0) return;
        await this.pushSender.send(tokens, input.notification);
    }
}
