export class SightingImage {
    constructor(
        private readonly _cloudinaryId: string,
        private readonly _photoUrl: string,
    ) { }

    static create(params: { cloudinaryId: string; photoUrl: string }): SightingImage {
        return new SightingImage(params.cloudinaryId, params.photoUrl);
    }

    get cloudinaryId(): string { return this._cloudinaryId; }
    get photoUrl(): string { return this._photoUrl; }
}