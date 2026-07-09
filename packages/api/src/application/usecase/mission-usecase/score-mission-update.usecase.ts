import { inject, injectable } from "tsyringe";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { UserExpAction } from "@domain/entities/UserExpAction";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedMissionEditError } from "@domain/errors/UnauthorizedMissionEditError";

export interface ScoreMissionUpdateDTO {
  updatePublicId: string;
  points: number;
}

@injectable()
export class ScoreMissionUpdateUseCase {
  constructor(
    @inject("MissionUpdateRepository")
    private readonly updateRepository: MissionUpdateRepository,

    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,

    @inject("ReportRepository")
    private readonly reportRepository: ReportRepository,

    @inject("UserRepository")
    private readonly userRepository: IUserRepository,

    @inject("UserExperienceRepository")
    private readonly userExperienceRepository: IUserExperienceRepository
  ) { }

  async execute(dto: ScoreMissionUpdateDTO, executorPublicId: string): Promise<void> {
    const update = await this.updateRepository.findByPublicId(dto.updatePublicId);
    if (!update) {
      throw new Error("Mission update not found");
    }

    if (update.pointValue !== null) {
      throw new Error("This comment has already been scored");
    }

    const allowedPoints = await this.updateRepository.findPointByContext("COMMENT");
    const pointValueObj = allowedPoints.find(p => p.points === dto.points);
    if (!pointValueObj) {
      throw new Error("Invalid point value for comments");
    }

    const mission = await this.missionRepository.findById(update.missionId);
    if (!mission) {
      throw new MissionNotFoundError("Mission not found");
    }

    const executor = await this.userRepository.findByPublicId(executorPublicId);
    if (!executor) {
      throw new UserNotFoundError();
    }

    const reportWithPetList = await this.reportRepository.findDetailsByIds([mission.reportId]);
    if (reportWithPetList.length === 0) {
      throw new Error("Report not found for mission");
    }
    const reportEntity = reportWithPetList[0]!.report;

    if (reportEntity.userId !== executor.requireInternalId()) {
      throw new UnauthorizedMissionEditError();
    }

    update.score(pointValueObj);

    await this.updateRepository.update(update);

    const author = await this.userRepository.findById(update.userId);
    if (!author) {
      throw new UserNotFoundError();
    }

    await this.userExperienceRepository.addExp(
      author.id,
      UserExpAction.VALUED_COMMENT,
      dto.points
    );
  }
}
