export class InvalidNotificationRadiusError extends Error {
    constructor(){
        super('Notification radius must be an integer between 1 and 100 kilometers');
        this.name = "InvalidNotificationRadiusError";
    }
}
