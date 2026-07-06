import { inject, injectable } from "tsyringe";

import type { MissionRepository } from "@domain/repositories/mission.repository";

@injectable()
export class GetMissionsUseCase {

  constructor(

    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository

  ) {}

  async execute() {

    return await this.missionRepository.findActive();

  }

}