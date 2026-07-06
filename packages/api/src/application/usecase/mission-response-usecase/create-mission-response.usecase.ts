import { inject, injectable } from "tsyringe";

import { MissionResponse } from "@domain/mission-response/MissionResponse";
import type { MissionResponseRepository } from "@domain/repositories/mission-response.repository";
import type { MissionRepository } from "@domain/repositories/mission.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

import { CreateMissionResponseDTO } from "./dto/create-mission-response.dto";

@injectable()
export class CreateMissionResponseUseCase {

  constructor(

    @inject("MissionResponseRepository")
    private readonly responseRepository: MissionResponseRepository,

    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,

    @inject("UserRepository")
private readonly userRepository: IUserRepository
 

  ) {}

  async execute(
    dto: CreateMissionResponseDTO,
    userPublicId: string
  ) {

    const mission = await this.missionRepository.findByPublicId(
      dto.missionPublicId
    );

    if (!mission) {
      throw new Error("Mission not found");
    }

    const user = await this.userRepository.findByPublicId(
      userPublicId
    );

    if (!user) {
      throw new Error("User not found");
    }

    const response = new MissionResponse(

      null,

      "",

      mission.missionId!,

      user.requireInternalId(),

      dto.comment,

      dto.photoUrl ?? null,

      "PENDING",

      new Date()

    );

    const id = await this.responseRepository.save(
      response
    );

    return {
      responseId: id
    };

  }

}