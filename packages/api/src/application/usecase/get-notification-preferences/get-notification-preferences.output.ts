export class GetNotificationPreferencesOutput {
    constructor(
        public readonly notificationRadius: number,
        public readonly lostReportsEnabled: boolean,
        public readonly sightingReportsEnabled: boolean,
        public readonly matchesEnabled: boolean,
        public readonly mutedUntil: Date | null, 
    ) {}
}