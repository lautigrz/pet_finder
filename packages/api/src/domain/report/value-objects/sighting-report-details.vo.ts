import { AnimalType } from "../../shared/animal-type/animal-type";

export class SightingReportDetails {
  constructor(
    public readonly _animalType: AnimalType,
    public readonly _hasIdCollar: boolean,
    private readonly _color: string,
  ) {}

  static create(params: { animalType: AnimalType, hasIdCollar: boolean, color: string }): SightingReportDetails {
    return new SightingReportDetails(
      params.animalType,
      params.hasIdCollar,
      params.color
    )
  }

  get animalType(): AnimalType {
    return this._animalType
  }
  get hasIdCollar(): boolean {
    return this._hasIdCollar
  }
  get color(): string{
    return this._color
  }
} 