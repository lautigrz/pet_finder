export class RemoveDeviceTokenInput {
    constructor(
        public readonly userPublicId: string,
        public readonly token: string,
    ) { }
}
