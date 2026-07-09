import { inject, injectable } from "tsyringe";

import { MissionUpdate } from "@domain/mission/MissionUpdate";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { CreateMissionUpdateDTO } from "./dto/mission-update.dto";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

@injectable()
export class CreateMissionUpdateUseCase {

  constructor(
    @inject("MissionUpdateRepository")
    private readonly updateRepository: MissionUpdateRepository,

    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,

    @inject("UserRepository")
    private readonly userRepository: IUserRepository
  ) { }

  async execute(
    dto: CreateMissionUpdateDTO,
    userPublicId: string
  ) {
    const mission = await this.missionRepository.findByPublicId(
      dto.missionPublicId
    );

    if (!mission) {
      throw new MissionNotFoundError("Mission not found");
    }

    const user = await this.userRepository.findByPublicId(
      userPublicId
    );

    if (!user) {
      throw new UserNotFoundError();
    }

    const update = MissionUpdate.create({
      missionId: mission.missionId!,
      userId: user.requireInternalId(),
      comment: dto.comment,
      photoUrl: dto.photoUrl ?? null
    });

    await this.updateRepository.save(update);

    return {
      publicId: update.publicId
    };
  }
}
