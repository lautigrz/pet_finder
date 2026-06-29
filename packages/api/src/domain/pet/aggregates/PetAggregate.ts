import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { SizeType } from "../../shared/size-type/size.type";
import { GenderType } from "../../shared/gender-type/gender.type";
import { InvalidPetNameError } from "../../errors/InvalidPetNameError";
import { PetImage } from "../value-objects/image.vo";
import { InvalidImageError } from "@domain/errors/InvalidImageError";


export interface CreatePetParams {
    userId: number;
    name: string;
    animalType: AnimalType;
    genderType: GenderType;
    sizeType: SizeType;
    color: string;
    hasIdCollar: boolean;
    isVaccinated: boolean;
    breed: string;
    petImage: PetImage[];
    createdAt?: Date;
}

export interface RestorePetParams {
    idPet: number | null;
    publicId: string;
    userId: number;
    name: string;
    animalType: AnimalType;
    genderType: GenderType;
    sizeType: SizeType;
    color: string;
    hasIdCollar: boolean;
    isVaccinated: boolean;
    breed: string;
    petImage: PetImage[];
    createdAt: Date;
    updatedAt?: Date | null;
}


export class Pet {

    private constructor(
        private readonly _idPet: number | null,
        private readonly _publicId: string,
        private readonly _userId: number,
        private _name: string,
        private _animalType: AnimalType,
        private _genderType: GenderType,
        private _sizeType: SizeType,
        private _color: string,
        private _hasIdCollar: boolean,
        private _isVaccinated: boolean,
        private _breed: string,
        private readonly _images: PetImage[],
        private readonly _createdAt: Date,
        private _updatedAt?: Date
    ) { this.validateName(); this.validateLenghtImage(); }


    static create(params: CreatePetParams) {
        return new Pet(
            null,
            crypto.randomUUID(),
            params.userId,
            params.name,
            params.animalType,
            params.genderType,
            params.sizeType,
            params.color,
            params.hasIdCollar,
            params.isVaccinated,
            params.breed,
            params.petImage,
            new Date(),
        )
    }

    static restore(params: RestorePetParams): Pet {

        return new Pet(
            params.idPet,
            params.publicId,
            params.userId,
            params.name,
            params.animalType,
            params.genderType,
            params.sizeType,
            params.color,
            params.hasIdCollar,
            params.isVaccinated,
            params.breed,
            params.petImage,
            params.createdAt,
            params.updatedAt ?? undefined
        );
    }


    get idPet(): number | null {
        return this._idPet
    }

    get publicId(): string {
        return this._publicId;
    }

    get userId(): number {
        return this._userId;
    }

    get name(): string {
        return this._name;
    }

    get animalType(): AnimalType {
        return this._animalType;
    }

    get genderType(): GenderType {
        return this._genderType;
    }

    get sizeType(): SizeType {
        return this._sizeType;
    }

    get color(): string {
        return this._color;
    }

    get hasIdCollar(): boolean {
        return this._hasIdCollar;
    }

    get breed(): string {
        return this._breed;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date | null {
        return this._updatedAt || null;
    }

    get images(): PetImage[] {
        return this._images;
    }

    get isVaccinated(): boolean {
        return this._isVaccinated;
    }


    rename(name: string): void {
        this._name = name;
        this.validateName();
        this.touch();
    }

    updateCollarStatus(hasCollar: boolean): void {
        this._hasIdCollar = hasCollar;
        this.touch();
    }

    updateColor(color: string): void {
        this._color = color;
        this.touch();
    }

    updateBreed(breed: string): void {
        this._breed = breed;
        this.touch();
    }

    updateAnimalType(animalType: AnimalType): void {
        this._animalType = animalType;
        this.touch();
    }

    updateGenderType(genderType: GenderType): void {
        this._genderType = genderType;
        this.touch();
    }

    updateSizeType(sizeType: SizeType): void {
        this._sizeType = sizeType;
        this.touch();
    }

    updateVaccinationStatus(isVaccinated: boolean): void {
        this._isVaccinated = isVaccinated;
        this.touch();
    }

    private validateName() {
        if (this._name.length < 2) {
            throw new InvalidPetNameError("Name must be at least 2 characters long");
        }
    }

    private validateLenghtImage() {
        if (this._images.length === 0 || this._images.length > 5) {
            throw new InvalidImageError("Image is required, maximum 5 images allowed");
        }
    }

    private touch(): void {
        this._updatedAt = new Date();
    }

}