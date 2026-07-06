import { inject, injectable } from "tsyringe";

import type { MissionRepository } from "@domain/repositories/mission.repository";
import type { MissionResponseRepository } from "@domain/repositories/mission-response.repository";

@injectable()
export class GetMissionResponsesUseCase {

  constructor(

    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,

    @inject("MissionResponseRepository")
    private readonly responseRepository: MissionResponseRepository

  ) {}

  async execute(missionPublicId: string) {

    const mission = await this.missionRepository.findByPublicId(
      missionPublicId
    );

    if (!mission) {
      throw new Error("Mission not found");
    }

    return this.responseRepository.findByMissionId(
      mission.missionId!
    );

  }

}