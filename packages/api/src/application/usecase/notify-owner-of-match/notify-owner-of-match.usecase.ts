import { MatchNotification } from "@pet-alert/shared";
import { PushNotification } from "../../../domain/services/IPushSender";
import { SendPushToUserUseCase } from "../send-push-to-user/send-push-to-user.usecase";
import { SendPushToUserInput } from "../send-push-to-user/send-push-to-user.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotifyOwnerOfMatchUseCase {
    constructor(
        @inject("SendPushToUserUseCase")
        private readonly sendPushToUser: SendPushToUserUseCase
    ) { }

    async execute(notification: MatchNotification): Promise<void> {
        await this.sendPushToUser.execute(
            new SendPushToUserInput(notification.ownerPublicId, this.buildPush(notification)),
        );
    }

    private buildPush(notification: MatchNotification): PushNotification {
        const pet = notification.lostPetName ?? "tu mascota";
        const percentage = Math.round(notification.score * 100);
        return {
            title: "¡Posible coincidencia de tu mascota! 🐾",
            body: `Encontramos una coincidencia del ${percentage}% con ${pet}. Tocá para verla.`,
            data: { reportId: notification.lostReportPublicId },
        };
    }
}
