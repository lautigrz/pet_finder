import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionOutputMapper } from "./mapper/mission.mapper";
import { MissionCardOutput } from "./dto/mission.output";
import { Report } from "@domain/report/aggregates/ReportAggregate";

import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";

@injectable()
export class GetJoinedMissionsUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userPublicId: string): Promise<MissionCardOutput[]> {
        const user = await this.userRepository.findByPublicId(userPublicId);
        if (!user) {
            throw new UserNotFoundError();
        }

        const userId = user.requireInternalId();
        const missions = await this.missionRepository.findByVolunteerId(userId);

        for (const mission of missions) {
            if (mission.hasExpired()) {
                mission.close();
                await this.missionRepository.update(mission);
            }
        }

        if (missions.length === 0) {
            return [];
        }

        const reportIds = missions.map(m => m.reportId);
        const uniqueReportIds = [...new Set(reportIds)];

        const reportsWithPet = await this.reportRepository.findDetailsByIds(uniqueReportIds);
        const reportsMap = new Map(reportsWithPet.map(item => [item.report.idReport!, item]));

        return missions.map(mission => {
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
