import { inject, injectable } from "tsyringe";

import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { MissionUpdateMapper, UserOutput } from "./mapper/mission-update.mapper";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { MissionUpdateOutput } from "./dto/mission-update.dto";

@injectable()
export class GetMissionUpdatesUseCase {

  constructor(
    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,

    @inject("MissionUpdateRepository")
    private readonly updateRepository: MissionUpdateRepository,

    @inject("UserRepository")
    private readonly userRepository: IUserRepository
  ) { }

  async execute(missionPublicId: string): Promise<MissionUpdateOutput[]> {
    const mission = await this.missionRepository.findByPublicId(
      missionPublicId
    );

    if (!mission || !mission.missionId) {
      throw new MissionNotFoundError("Mission not found");
    }

    const updates = await this.updateRepository.findByMissionId(
      mission.missionId
    );

    if (updates.length === 0) {
      return [];
    }

    const userIds = updates.map(u => u.userId);
    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.userRepository.findByIds(uniqueUserIds);
    const usersMap = new Map(users.map(u => [u.user_id, u]));

    return updates.map(u => {
      const author = usersMap.get(u.userId);

      if (!author) {
        throw new UserNotFoundError();
      }

      return MissionUpdateMapper.toOutput(u, author);
    });
  }
}
