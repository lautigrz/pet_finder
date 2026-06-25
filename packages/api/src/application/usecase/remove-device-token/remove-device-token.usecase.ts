import type { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import { RemoveDeviceTokenInput } from "./remove-device-token.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class RemoveDeviceTokenUseCase {
    constructor(
        @inject("DeviceTokenRepository")
        private readonly deviceTokenRepository: IDeviceTokenRepository,
    ) { }

    async execute(input: RemoveDeviceTokenInput): Promise<void> {
        await this.deviceTokenRepository.removeForUser(input.userPublicId, input.token);
    }
}
