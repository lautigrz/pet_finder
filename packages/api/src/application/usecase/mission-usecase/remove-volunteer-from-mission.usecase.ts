import { inject, injectable } from "tsyringe";

import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class RemoveVolunteerFromMissionUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository
    ) { }

    async execute(missionPublicId: string, ownerPublicId: string, volunteerPublicId: string): Promise<void> {
        const mission = await this.missionRepository.findByPublicId(missionPublicId);
        if (!mission) {
            throw new MissionNotFoundError(missionPublicId);
        }

        const owner = await this.userRepository.findByPublicId(ownerPublicId);

        if (!owner) {
            throw new UserNotFoundError();
        }

        const volunteer = await this.userRepository.findByPublicId(volunteerPublicId);
        if (!volunteer) {
            throw new UserNotFoundError();
        }

        const reportWithPetList = await this.reportRepository.findDetailsByIds([
            mission.reportId,
        ]);

        if(reportWithPetList.length === 0) {
            throw new Error("Report not found for mission");
        }

        const reportEntity = reportWithPetList[0]!.report;

        const ownerInternalId = owner.requireInternalId();
        const volunteerInternalId = volunteer.requireInternalId();

        if(reportEntity.userId !== ownerInternalId) {
            throw new Error("Solo el dueño de la misión puede eliminar voluntarios");
        }

        if(ownerInternalId === volunteerInternalId) {
            throw new Error("No podes eliminarte como voluntario de tu propia misión");
        }
        if(mission.status === "CLOSED"){
            throw new Error("No podes eliminar voluntarios de una misión cerrada");
        }

        if(!mission.volunteerIds.includes(volunteerInternalId)) {
            throw new Error("El usuario no participa como voluntario en esta misión");
        }

        mission.leaveVolunteer(volunteerInternalId);
        await this.missionRepository.update(mission);
    }
}
