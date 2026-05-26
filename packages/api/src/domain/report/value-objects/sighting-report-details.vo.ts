

export class SightingReportDetails {
  constructor(
    public readonly _animalTypeId: number,
    public readonly _hasIdCollar: boolean,
    private readonly _color: string,
  ) {}

  static create(params: { animalTypeId: number, hasIdCollar: boolean, color: string }): SightingReportDetails {
    return new SightingReportDetails(
      params.animalTypeId,
      params.hasIdCollar,
      params.color
    )
  }

  get animalTypeId(): number {
    return this._animalTypeId
  }
  get hasIdCollar(): boolean {
    return this._hasIdCollar
  }
  get color(): string{
    return this._color
  }
} 