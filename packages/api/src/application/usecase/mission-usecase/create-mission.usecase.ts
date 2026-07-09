import { inject, injectable } from "tsyringe";

import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { CreateMissionDTO } from "./dto/create-mission.dto";

@injectable()
export class CreateMissionUseCase {

    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,

        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository
    ) { }

    async execute(dto: CreateMissionDTO) {
        const report = await this.reportRepository.findByPublicId(
            dto.reportPublicId
        );

        if (!report) {
            throw new Error("Report not found");
        }

        const existingMission = await this.missionRepository.findByReportId(
            report.idReport!
        );

        if (existingMission) {
            const searchArea = SearchArea.create(dto.latitude, dto.longitude, dto.radius);
            existingMission.updateDetails({
                searchArea,
                title: dto.title,
                description: dto.description,
                reportOwnerId: report.userId,
                executorId: report.userId
            });

            await this.missionRepository.update(existingMission);

            return {
                publicId: existingMission.publicId
            };
        }

        const searchArea = SearchArea.create(dto.latitude, dto.longitude, dto.radius);
        const mission = Mission.create({
            reportId: report.idReport!,
            searchArea,
            title: dto.title,
            description: dto.description
        });

        await this.missionRepository.save(mission);

        return {
            publicId: mission.publicId
        };
    }
}