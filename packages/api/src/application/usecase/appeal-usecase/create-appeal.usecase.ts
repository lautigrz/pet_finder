import { inject, injectable } from "tsyringe";
import type { AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { Appeal } from "@domain/appeal/Appeal";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { AlreadyAppealedError } from "@domain/appeal/errors/AlreadyAppealedError";
import { InvalidAppealTokenError } from "@domain/appeal/errors/InvalidAppealTokenError";
import { CreateAppealInput } from "./create-appeal.input";
import { CreateAppealOutput } from "./create-appeal.output";

@injectable()
export class CreateAppealUseCase {
    constructor(
        @inject("AppealRepository")
        private readonly appealRepository: AppealRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("AppealTokenSigner")
        private readonly tokenSigner: IAppealTokenSigner,
    ) { }

    async execute(input: CreateAppealInput): Promise<CreateAppealOutput> {
        const { targetType, targetPublicId, appellantPublicId } = this.tokenSigner.verify(input.token);
        await this.assertNotAlreadyAppealed(targetType, targetPublicId);
        const appellantUserId = await this.resolveAppellant(appellantPublicId);
        const appeal = this.buildAppeal(input.message, appellantUserId, targetType, targetPublicId);
        await this.appealRepository.save(appeal);
        return new CreateAppealOutput(appeal.publicId);
    }

    private async assertNotAlreadyAppealed(targetType: AppealTargetType, targetPublicId: string): Promise<void> {
        if (await this.appealRepository.existsForTarget(targetType, targetPublicId)) throw new AlreadyAppealedError();
    }

    private async resolveAppellant(publicId: string): Promise<number> {
        const user = await this.userRepository.findByPublicId(publicId);
        if (!user) throw new InvalidAppealTokenError();
        return user.requireInternalId();
    }

    private buildAppeal(message: string, appellantUserId: number, targetType: AppealTargetType, targetPublicId: string): Appeal {
        return Appeal.create({
            publicId: crypto.randomUUID(),
            appellantUserId,
            targetType,
            targetPublicId,
            message,
        });
    }
}
