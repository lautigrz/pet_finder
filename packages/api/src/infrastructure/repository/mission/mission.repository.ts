import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { Mission } from "@domain/mission/Mission";
import { MissionRepository } from "@domain/mission/repositories/mission.repository";
import { MissionMapper } from "./mission.mapper";
import { missionStatusMap } from "@domain/mission/types/mission.status";

@injectable()
export class PrismaMissionRepository implements MissionRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient
    ) { }

    async save(mission: Mission): Promise<number> {

        const missionPersistence = MissionMapper.toPersistence(mission);
        const created = await this.prisma.mission.create({
            data: missionPersistence
        });

        return created.mission_id;
    }

    async findByPublicId(publicId: string): Promise<Mission | null> {
        const record = await this.prisma.mission.findUnique({
            where: {
                public_id: publicId
            },
            include: {
                volunteers: true
            }
        });

        if (!record) {
            return null;
        }

        return MissionMapper.toDomain(record);
    }

    async findActive(): Promise<Mission[]> {
        const records = await this.prisma.mission.findMany({
            where: {
                mission_status_id: { in: [1, 2] }
            },
            include: {
                volunteers: true
            },
            orderBy: {
                created_at: "desc"
            }
        });

        return records.map(record => MissionMapper.toDomain(record));
    }

    async findByReportId(reportId: number): Promise<Mission | null> {
        const record = await this.prisma.mission.findFirst({
            where: {
                report_id: reportId,
                mission_status_id: { in: [1, 2] }
            },
            include: {
                volunteers: true
            }
        });

        if (!record) {
            return null;
        }

        return MissionMapper.toDomain(record);
    }

    async findByVolunteerId(volunteerId: number): Promise<Mission[]> {
        const records = await this.prisma.mission.findMany({
            where: {
                volunteers: {
                    some: {
                        user_id: volunteerId
                    }
                }
            },
            include: {
                volunteers: true
            },
            orderBy: {
                created_at: "desc"
            }
        });

        return records.map(record => MissionMapper.toDomain(record));
    }

    async update(mission: Mission): Promise<void> {
        const statusId = missionStatusMap[mission.status];

        await this.prisma.$transaction(async (tx) => {
            await tx.mission.update({
                where: {
                    mission_id: mission.missionId!
                },
                data: {
                    latitude: mission.searchArea.latitude,
                    longitude: mission.searchArea.longitude,
                    radius: mission.searchArea.radius,
                    title: mission.title,
                    description: mission.description,
                    mission_status_id: statusId,
                    updated_at: mission.updatedAt
                }
            });

            const currentVolunteers = await tx.missionVolunteer.findMany({
                where: { mission_id: mission.missionId! }
            });
            const dbUserIds = currentVolunteers.map(v => v.user_id);

            const domainUserIds = mission.volunteerIds;
            const toAdd = domainUserIds.filter(id => !dbUserIds.includes(id));
            const toDelete = dbUserIds.filter(id => !domainUserIds.includes(id));

            if (toAdd.length > 0) {
                await tx.missionVolunteer.createMany({
                    data: toAdd.map(userId => ({
                        mission_id: mission.missionId!,
                        user_id: userId
                    }))
                });
            }

            if (toDelete.length > 0) {
                await tx.missionVolunteer.deleteMany({
                    where: {
                        mission_id: mission.missionId!,
                        user_id: { in: toDelete }
                    }
                });
            }
        });
    }
}