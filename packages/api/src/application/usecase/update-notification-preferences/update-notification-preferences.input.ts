export class UpdateNotificationPreferencesInput {
    constructor(
        public readonly publicId: string,
        public readonly notificationRadius: number,
    ) {}
}