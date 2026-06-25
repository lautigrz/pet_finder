import { injectable, inject } from "tsyringe";
import type { INotificationPreferencesRepository } from "../../../domain/repositories/INotificationPreferencesRepository";
import { GetNotificationPreferencesOutput } from "./get-notification-preferences.output";

@injectable()
export class GetNotificationPreferencesUseCase {
    constructor(
        @inject("NotificationPreferencesRepository")
        private readonly notificationPreferencesRepository: INotificationPreferencesRepository,
    ) { }

    async execute(userPublicId: string,): Promise<GetNotificationPreferencesOutput> {
        const preferences = await this.notificationPreferencesRepository.getOrCreateByUserPublicId(userPublicId);
        return new GetNotificationPreferencesOutput(
            preferences.notificationRadius,
            preferences.lostReportsEnabled,
            preferences.sightingReportsEnabled,
            preferences.matchesEnabled,
            preferences.mutedUntil
        );
    }
}