import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { MissionOutputMapper } from "./mapper/mission.mapper";
import { MissionCardOutput } from "./dto/mission.output";
import { Report } from "@domain/report/aggregates/ReportAggregate";

import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";

@injectable()
export class GetMissionsUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
    ) { }

    async execute(): Promise<MissionCardOutput[]> {
        const missions = await this.missionRepository.findActive();
        const activeMissions = [];

        for (const mission of missions) {
            if (mission.hasExpired()) {
                mission.close();
                await this.missionRepository.update(mission);
            } else {
                activeMissions.push(mission);
            }
        }

        if (activeMissions.length === 0) {
            return [];
        }

        const reportIds = activeMissions.map(m => m.reportId);
        const uniqueReportIds = [...new Set(reportIds)];

        const reportsWithPet = await this.reportRepository.findDetailsByIds(uniqueReportIds);
        const reportsMap = new Map(reportsWithPet.map(item => [item.report.idReport!, item]));

        return activeMissions.map(mission => {
            const reportItem = reportsMap.get(mission.reportId);
            if (!reportItem) {
                throw new ReportNotFoundError(`Report not found for mission ${mission.publicId}`);
            }

            const { report, pet } = reportItem;
            const reportPhotoUrl = this.resolveReportPhotoUrl(report, pet);

            return MissionOutputMapper.toSummaryOutput({
                mission,
                report,
                pet,
                reportPhotoUrl
            });
        });
    }

    private resolveReportPhotoUrl(report: Report, pet?: Pet): string | null {
        if (report.reportType === ReportType.SIGHTING) {
            const details = report.details as SightingReportDetails;
            if (details.images && details.images.length > 0) {
                return details.images[0]!.photoUrl;
            }
        } else if (report.reportType === ReportType.LOST && pet) {
            if (pet.images && pet.images.length > 0) {
                return pet.images[0]!.photoUrl;
            }
        }

        return null;
    }
}