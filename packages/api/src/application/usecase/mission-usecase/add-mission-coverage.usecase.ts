import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

@injectable()
export class AddMissionCoverageUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("MissionCoverageRepository")
        private readonly missionCoverageRepository: MissionCoverageRepository
    ) { }

    async execute(missionPublicId: string, userPublicId: string, cells: string[]): Promise<void> {
        const mission = await this.missionRepository.findByPublicId(missionPublicId);
        if (!mission) {
            throw new MissionNotFoundError(missionPublicId);
        }

        const user = await this.userRepository.findByPublicId(userPublicId);
        if (!user) {
            throw new Error("User not found");
        }

        const missionId = mission.missionId!;
        const userId = user.requireInternalId();

        await this.missionCoverageRepository.saveCoverage(missionId, userId, cells);
    }
}
