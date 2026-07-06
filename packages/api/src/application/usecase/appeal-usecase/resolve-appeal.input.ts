export class ResolveAppealInput {
    constructor(
        public readonly publicId: string,
        public readonly accept: boolean,
    ) { }
}
