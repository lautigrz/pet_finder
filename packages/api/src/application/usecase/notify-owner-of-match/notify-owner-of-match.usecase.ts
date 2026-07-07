import { MatchNotification } from "@pet-alert/shared";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IEmailService } from "../../../domain/services/IEmailService";
import type { INotificationPreferencesRepository } from "../../../domain/repositories/INotificationPreferencesRepository";
import { NotificationPreference } from "../../../domain/entities/NotificationPreference";
import { PushNotification } from "../../../domain/services/IPushSender";
import { SendPushToUserUseCase } from "../send-push-to-user/send-push-to-user.usecase";
import { SendPushToUserInput } from "../send-push-to-user/send-push-to-user.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotifyOwnerOfMatchUseCase {
    constructor(
        @inject("SendPushToUserUseCase")
        private readonly sendPushToUser: SendPushToUserUseCase,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("EmailService")
        private readonly emailService: IEmailService,
        @inject("NotificationPreferencesRepository")
        private readonly notificationPreferencesRepository: INotificationPreferencesRepository,
    ) { }

    async execute(notification: MatchNotification): Promise<void> {
        const preferences = await this.notificationPreferencesRepository.getOrCreateByUserPublicId(notification.ownerPublicId);
        if (!this.acceptsMatches(preferences)) return;

        await this.sendPushToUser.execute(
            new SendPushToUserInput(notification.ownerPublicId, this.buildPush(notification)),
        );
        await this.notifyByEmail(notification);
    }

    private acceptsMatches(preferences: NotificationPreference): boolean {
        const muted = preferences.mutedUntil !== null && preferences.mutedUntil > new Date();
        return preferences.matchesEnabled && !muted;
    }
    private async notifyByEmail(notification: MatchNotification): Promise<void> {
        const owner = await this.userRepository.findByPublicId(notification.ownerPublicId);
        if (!owner) return;
        await this.emailService.sendMatchAlert(
            owner.email,
            notification.lostPetName ?? "tu mascota",
            Math.round(notification.score * 100),
            notification.lostReportPublicId,
            this.recipientImage(notification),
        );
    }

    private recipientImage(notification: MatchNotification): string | null {
        return notification.rol === "dueno" ? notification.lostPetImage : notification.matchedImage;
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
