import { AnimalType } from "../../shared/animal-type/animal-type";
import { SightingImage } from "./sighting.images";

export class SightingReportDetails {
  constructor(
    private readonly _animalType: AnimalType,
    private readonly _hasIdCollar: boolean,
    private readonly _color: string,
    private readonly _isInTransit: boolean,
    private readonly _images: SightingImage[],

  ) { }

  static create(params: { animalType: AnimalType, hasIdCollar: boolean, color: string, isInTransit: boolean, images: SightingImage[] }): SightingReportDetails {
    return new SightingReportDetails(
      params.animalType,
      params.hasIdCollar,
      params.color,
      params.isInTransit,
      params.images
    )
  }

  get animalType(): AnimalType {
    return this._animalType
  }
  get hasIdCollar(): boolean {
    return this._hasIdCollar
  }
  get color(): string {
    return this._color
  }
  get images(): SightingImage[] {
    return this._images
  }
  get isInTransit(): boolean {
    return this._isInTransit
  }
} 