import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class JoinMissionUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository
    ) { }

    async execute(missionPublicId: string, userPublicId: string): Promise<void> {
        const mission = await this.missionRepository.findByPublicId(missionPublicId);
        if (!mission) {
            throw new MissionNotFoundError(missionPublicId);
        }

        const user = await this.userRepository.findByPublicId(userPublicId);
        if (!user) {
            throw new UserNotFoundError();
        }

        mission.joinVolunteer(user.requireInternalId());

        await this.missionRepository.update(mission);
    }
}
