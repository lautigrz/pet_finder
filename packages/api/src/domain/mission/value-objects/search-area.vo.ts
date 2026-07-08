import { Coordinates } from "../../report/value-objects/coordinates.vo";
import { InvalidFieldError } from "../../errors/InvalidFieldError";

export class SearchArea {
  constructor(
    private readonly _coordinates: Coordinates,
    private readonly _radius: number
  ) {
    this.validate();
  }

  static create(latitude: number, longitude: number, radius: number): SearchArea {
    const coordinates = new Coordinates(latitude, longitude);
    return new SearchArea(coordinates, radius);
  }

  get latitude(): number {
    return this._coordinates.latitude;
  }

  get longitude(): number {
    return this._coordinates.longitude;
  }

  get radius(): number {
    return this._radius;
  }

  get coordinates(): Coordinates {
    return this._coordinates;
  }

  private validate(): void {
    if (this._radius <= 0) {
      throw new InvalidFieldError("radius", "Radius must be greater than zero");
    }
    if (!Number.isInteger(this._radius)) {
      throw new InvalidFieldError("radius", "Radius must be an integer");
    }
  }
}
