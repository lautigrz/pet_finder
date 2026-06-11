import { INotificationPreferencesRepository } from "../../../domain/repositories/INotificationPreferencesRepository";
import { GetNotificationPreferencesOutput } from "./get-notification-preferences.output";

export class GetNotificationPreferencesUseCase {
    constructor(
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