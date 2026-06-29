import type { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import { RegisterDeviceTokenInput } from "./register-device-token.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class RegisterDeviceTokenUseCase {
    constructor(
        @inject("DeviceTokenRepository")
        private readonly deviceTokenRepository: IDeviceTokenRepository,
    ) { }

    async execute(input: RegisterDeviceTokenInput): Promise<void> {
        await this.deviceTokenRepository.registerForUser(input.userPublicId, input.token);
    }
}
