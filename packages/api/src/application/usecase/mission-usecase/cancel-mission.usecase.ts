import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";

@injectable()
export class CancelMissionUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
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
            throw new Error("User not found");
        }

        const reportWithPetList = await this.reportRepository.findDetailsByIds([mission.reportId]);
        if (reportWithPetList.length === 0) {
            throw new Error("Report not found for mission");
        }
        const reportEntity = reportWithPetList[0]!.report;

        mission.cancel(reportEntity.userId, user.requireInternalId());

        await this.missionRepository.update(mission);
    }
}
