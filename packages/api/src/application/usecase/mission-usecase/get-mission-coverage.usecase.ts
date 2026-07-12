import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

@injectable()
export class GetMissionCoverageUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("MissionCoverageRepository")
        private readonly missionCoverageRepository: MissionCoverageRepository
    ) { }

    async execute(missionPublicId: string, since?: Date): Promise<{ cells: string[]; lastSyncTimestamp: Date }> {
        const mission = await this.missionRepository.findByPublicId(missionPublicId);
        if (!mission) {
            throw new MissionNotFoundError(missionPublicId);
        }

        const missionId = mission.missionId!;
        return this.missionCoverageRepository.getCoverage(missionId, since);
    }
}
