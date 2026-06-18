import { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import { RemoveDeviceTokenInput } from "./remove-device-token.input";

export class RemoveDeviceTokenUseCase {
    constructor(
        private readonly deviceTokenRepository: IDeviceTokenRepository,
    ) { }

    async execute(input: RemoveDeviceTokenInput): Promise<void> {
        await this.deviceTokenRepository.removeForUser(input.userPublicId, input.token);
    }
}
