import { inject, injectable } from "tsyringe";

import { Mission } from "@domain/mission/Mission";
import { MissionRepository } from "@domain/repositories/mission.repository";
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

        existingMission.latitude = dto.latitude;
        existingMission.longitude = dto.longitude;
        existingMission.radius = dto.radius;
        existingMission.title = dto.title;
existingMission.description = dto.description;

        await this.missionRepository.update(existingMission);

        return {
            missionId: existingMission.missionId
        };

    }

    const mission = new Mission(

    null,

    "",

    report.idReport!,

    dto.latitude,

    dto.longitude,

    dto.radius,

    dto.title,

    dto.description,

    "ACTIVE",

    new Date(),

    null

);

    const id = await this.missionRepository.save(mission);

    return {
        missionId: id
    };

}



}