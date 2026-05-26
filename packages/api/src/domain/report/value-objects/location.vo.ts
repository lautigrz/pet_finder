
import { Coordinates } from "./coordinates.vo";

export class Location {

    constructor(
        private readonly _address: string | null,
        private readonly coordinates: Coordinates
    ){
        this.validate()
    }

    static create(params: { address: string | null, latitude: number, longitude: number }): Location {
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
            throw new Error("Address too short")
        }

        if (trimmed.length > 200) {
            throw new Error("Address too long")
        }

        if (!/[a-zA-Z]/.test(trimmed)) {
            throw new Error("Invalid address format")
        }
        }
    }
}