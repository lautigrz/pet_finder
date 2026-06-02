import { GenderType } from "@domain/shared/gender-type/gender.type";
import { AnimalType } from "../../shared/animal-type/animal-type";
import { SightingImage } from "./sighting.images";
import { SizeType } from "@domain/shared/size-type/size.type";


interface CreateSightingReportDetailsParams {
  petName?: string;
  animalType: AnimalType;
  genderType?: GenderType;
  sizeType?: SizeType;
  breed?: string;
  hasIdCollar: boolean;
  color: string;
  isInTransit: boolean;
  images: SightingImage[];
}

export class SightingReportDetails {
  constructor(

    private readonly _petName: string | null,
    private readonly _animalType: AnimalType,
    private readonly _genderType: GenderType | null,
    private readonly _sizeType: SizeType | null,
    private readonly _breed: string | null,
    private readonly _hasIdCollar: boolean,
    private readonly _color: string,
    private readonly _isInTransit: boolean,
    private readonly _images: SightingImage[],

  ) { }

  static create(params: CreateSightingReportDetailsParams): SightingReportDetails {
    return new SightingReportDetails(
      params.petName || null,
      params.animalType,
      params.genderType || null,
      params.sizeType || null,
      params.breed || null,
      params.hasIdCollar,
      params.color,
      params.isInTransit,
      params.images
    )
  }

  get petName(): string | null {
    return this._petName
  }
  get animalType(): AnimalType {
    return this._animalType
  }
  get genderType(): GenderType | null {
    return this._genderType
  }
  get sizeType(): SizeType | null {
    return this._sizeType
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
  get breed(): string | null {
    return this._breed
  }
} 