import { NotificationPreference } from "@domain/entities/NotificationPreference";

export interface UpdateNotificationPreferencesData{
    notificationRadius?: number;
    lostReportsEnabled?: boolean;
    sightingReportsEnabled?: boolean;
    matchesEnabled?: boolean;
    mutedUntil?: Date | null;
}

export interface INotificationPreferencesRepository {
    getOrCreateByUserPublicId(userPublicId:string,): Promise<NotificationPreference>;
    updateByUserPublicId(userPublicId: string, data: UpdateNotificationPreferencesData): Promise<NotificationPreference>;
}