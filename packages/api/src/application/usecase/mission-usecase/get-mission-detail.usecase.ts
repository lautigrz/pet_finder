import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { MissionOutputMapper } from "./mapper/mission.mapper";
import { MissionOutput } from "./dto/mission.output";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class GetMissionDetailUseCase {
    constructor(
        @inject("MissionRepository")
        private readonly missionRepository: MissionRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository
    ) { }

    async execute(publicId: string): Promise<MissionOutput> {
        const mission = await this.missionRepository.findByPublicId(publicId);
        if (!mission) {
            throw new MissionNotFoundError(publicId);
        }

        if (mission.hasExpired()) {
            mission.close();
            await this.missionRepository.update(mission);
        }

        const reportWithPetList = await this.reportRepository.findDetailsByIds([mission.reportId]);

        const reportItem = reportWithPetList[0];
        if (!reportItem) {
            throw new ReportNotFoundError(mission.reportId.toString());
        }

        const { report, pet } = reportItem;

        const reportPhotoUrl: string | null = this.resolveReportPhotoUrl(report, pet);

        const users = mission.volunteerIds.length > 0
            ? await this.userRepository.findByIds(mission.volunteerIds)
            : [];
        const usersMap = new Map(users.map(u => [u.user_id, u]));

        const volunteers = mission.volunteerIds.map(vid => {
            const user = usersMap.get(vid);
            if (!user) {
                throw new UserNotFoundError();
            }
            return this.buildSummaryUser(user);
        });

        return MissionOutputMapper.toOutput({
            mission,
            report,
            pet,
            reportPhotoUrl,
            volunteers
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

    private buildSummaryUser(user: { public_id: string, username: string, photoUrl: string | null }) {
        return {
            publicId: user?.public_id || "",
            username: user?.username || "",
            photoUrl: user?.photoUrl ?? null,
        }
    }
}
