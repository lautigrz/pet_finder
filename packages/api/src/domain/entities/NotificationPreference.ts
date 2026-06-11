export class NotificationPreference{
    private constructor(
        public readonly internalId: number | null,
        public readonly userInternalId: number,
        public readonly notificationRadius: number,
        public readonly lostReportsEnabled: boolean,
        public readonly sightingReportsEnabled: boolean,
        public readonly matchesEnabled: boolean,
        public readonly mutedUntil: Date | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    )
    {}

    static createDefault(userInternalId:number): NotificationPreference {
        const now = new Date();
        return new NotificationPreference(null, userInternalId, 5, true, true, true, null, now, now);
    }

    static reconstruct(internalId: number, userInternalId: number, notificationRadius: number, lostReportsEnabled: boolean, sightingReportsEnabled: boolean, matchesEnabled: boolean, mutedUntil: Date | null, createdAt: Date, updatedAt: Date): NotificationPreference {
        return new NotificationPreference(internalId, userInternalId, notificationRadius, lostReportsEnabled, sightingReportsEnabled, matchesEnabled, mutedUntil, createdAt, updatedAt);
    }
}