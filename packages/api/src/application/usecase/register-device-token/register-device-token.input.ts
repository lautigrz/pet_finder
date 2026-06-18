export class RegisterDeviceTokenInput {
    constructor(
        public readonly userPublicId: string,
        public readonly token: string,
    ) { }
}
