import { PushNotification } from "../../../domain/services/IPushSender";

export class SendPushToUserInput {
    constructor(
        public readonly userPublicId: string,
        public readonly notification: PushNotification,
    ) { }
}
