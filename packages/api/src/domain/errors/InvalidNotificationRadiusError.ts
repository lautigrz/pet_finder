import { DomainError } from "./DomainError";

export class InvalidNotificationRadiusError extends DomainError {
    constructor() {
        super('Notification radius must be an integer between 1 and 100 kilometers', "INVALID_NOTIFICATION_RADIUS");
    }
}
