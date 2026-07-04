export class CreateAppealInput {
    constructor(
        public readonly token: string,
        public readonly message: string,
    ) { }
}
