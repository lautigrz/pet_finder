export class UpdateNotificationPreferencesInput {
    constructor(
        public readonly userPublicId: string,
        public readonly notificationRadius?: number,
        public readonly lostReportsEnabled?: boolean,
        public readonly sightingReportsEnabled?: boolean,
        public readonly matchesEnabled?: boolean,
        public readonly mutedUntil?: Date | null,
    ) {}
}