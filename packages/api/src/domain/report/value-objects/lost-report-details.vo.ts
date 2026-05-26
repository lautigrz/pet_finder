

export class LostReportDetails{
    constructor(
        public readonly _petId: number,

    ){}

    static create(params: { petId: number}): LostReportDetails {
        return new LostReportDetails(
            params.petId,
        )
    }

    get petId(): number {
        return this._petId
    }
}