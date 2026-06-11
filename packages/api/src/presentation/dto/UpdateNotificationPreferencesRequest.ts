export interface UpdateNotificationPreferencesRequest {
     notificationRadius?: number;
     lostReportsEnabled?: boolean;
     sightingReportsEnabled?: boolean;
     matchesEnabled?: boolean;
     mutedUntil?: string | null;
}