import { inject, injectable } from "tsyringe";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

export interface UpdateMissionDTO {
  missionPublicId: string;
  userPublicId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
}

@injectable()
export class UpdateMissionUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository
    ) { }

    async execute(dto: UpdateMissionDTO): Promise<void> {
        const mission = await this.missionRepository.findByPublicId(dto.missionPublicId);
        if (!mission) {
            throw new MissionNotFoundError(dto.missionPublicId);
        }

        const user = await this.userRepository.findByPublicId(dto.userPublicId);
        if (!user) {
            throw new Error("User not found");
        }

        const reportWithPetList = await this.reportRepository.findDetailsByIds([mission.reportId]);
        if (reportWithPetList.length === 0) {
            throw new Error("Report not found for mission");
        }
        const reportEntity = reportWithPetList[0]!.report;

        const searchArea = SearchArea.create(dto.latitude, dto.longitude, dto.radius);
        mission.updateDetails({
            searchArea,
            title: dto.title,
            description: dto.description,
            reportOwnerId: reportEntity.userId,
            executorId: user.requireInternalId()
        });

        await this.missionRepository.update(mission);
    }
}
