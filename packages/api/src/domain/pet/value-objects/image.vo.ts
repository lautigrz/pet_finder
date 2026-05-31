export class PetImage {
    constructor(
        private readonly _cloudinaryId: string,
        private readonly _photoUrl: string,
    ) { }

    static create(params: { cloudinaryId: string; photoUrl: string }): PetImage {
        return new PetImage(params.cloudinaryId, params.photoUrl);
    }

    get cloudinaryId(): string { return this._cloudinaryId; }
    get photoUrl(): string { return this._photoUrl; }
}