
export abstract class ApplicationError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = this.constructor.name;
    }
}