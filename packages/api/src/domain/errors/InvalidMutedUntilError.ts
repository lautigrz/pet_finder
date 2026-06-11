export class InvalidMutedUntilError extends Error{
    constructor(){
        super("mutedUntil must be a valid future ISO date or null");
        this.name = "InvalidMutedUntilError";
    }

}