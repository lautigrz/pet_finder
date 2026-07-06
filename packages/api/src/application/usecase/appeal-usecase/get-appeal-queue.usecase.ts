import { inject, injectable } from "tsyringe";
import type { AppealRepository, AppealQueueItem } from "@domain/appeal/repositories/appeal.repository";
import { AppealStatus } from "@domain/appeal/types/appeal-status";

@injectable()
export class GetAppealQueueUseCase {
    constructor(
        @inject("AppealRepository")
        private readonly appealRepository: AppealRepository,
    ) { }

    async execute(status: AppealStatus = AppealStatus.PENDING): Promise<AppealQueueItem[]> {
        return this.appealRepository.findQueueByStatus(status);
    }
}
