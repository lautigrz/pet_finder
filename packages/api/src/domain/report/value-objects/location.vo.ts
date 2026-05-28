
import { InvalidLocationError } from "../../errors/InvalidLocationError";
import { Coordinates } from "./coordinates.vo";

export class Location {

    constructor(
        private readonly _address: string | null,
        private readonly coordinates: Coordinates
    ) {
        this.validate()
    }

    static create(params: { address: string | null, latitude: number, longitude: number }): Location {
        if (params.latitude === null || params.longitude === null) {
            throw new InvalidLocationError('Latitude and longitude are required');
        }

        return new Location(
            params.address,
            new Coordinates(params.latitude, params.longitude)
        )
    }


    get latitude(): number {
        return this.coordinates.latitude
    }

    get longitude(): number {
        return this.coordinates.longitude
    }

    get address(): string | null {
        return this._address
    }

    private validate(): void {
        if (this._address) {
            const trimmed = this._address.trim()

            if (trimmed.length < 5) {
                throw new InvalidLocationError("Address too short")
            }

            if (trimmed.length > 200) {
                throw new InvalidLocationError("Address too long")
            }

            if (!/[a-zA-Z]/.test(trimmed)) {
                throw new InvalidLocationError("Invalid address format")
            }
        }
    }
}