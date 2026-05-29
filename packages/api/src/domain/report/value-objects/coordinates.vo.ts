import { InvalidCoordinatesError } from "../../errors/InvalidCoordinatesError";

export class Coordinates {
    constructor(
        private readonly _latitude: number,
        private readonly _longitude: number
    ){
        this.validate()
    }

    get latitude(): number {
        return this._latitude
    }

    get longitude(): number {
        return this._longitude
    }


    private validate(): void {
        if (this._latitude < -90 || this._latitude > 90) {
            throw new InvalidCoordinatesError('Latitude must be between -90 and 90')
        }
        if (this._longitude < -180 || this._longitude > 180) {
            throw new InvalidCoordinatesError('Longitude must be between -180 and 180')
        }
    }
}