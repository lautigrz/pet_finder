import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { Mission } from "@domain/mission/Mission";
import { MissionRepository } from "@domain/repositories/mission.repository";
import { MissionMapper } from "./MissionMapper";

@injectable()
export class PrismaMissionRepository implements MissionRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient
    ) {}

    async save(mission: Mission): Promise<number> {

        const created = await this.prisma.mission.create({
            data: {
                report_id: mission.reportId,
                latitude: mission.latitude,
                longitude: mission.longitude,
                radius: mission.radius,
                  title: mission.title,
                 description: mission.description,
                status: mission.status
            }
        });

        return created.mission_id;
    }

    async findByPublicId(publicId: string): Promise<Mission | null> {

        const record = await this.prisma.mission.findUnique({
            where: {
                public_id: publicId
            }
        });

        if (!record) {
            return null;
        }

        return MissionMapper.toDomain(record);
    }

 async findActive(): Promise<any[]> {

    const missions = await this.prisma.mission.findMany({

        where: {
            status: "ACTIVE"
        },

        include: {

            report: {

                include: {

                    reportImages: true,

                    lost_report_detail: {
                        include: {
                            pet: {
                                include: {
                                    petImages: true
                                }
                            }
                        }
                    },

                    sighting_report_detail: true,

                    user: {
                        select: {
                            username: true,
                            photo_url: true
                        }
                    }

                }

            }

        },

        orderBy: {
            created_at: "desc"
        }

    });

    return missions;

}

async findByReportId(reportId: number): Promise<Mission | null> {

    const record = await this.prisma.mission.findFirst({
        where: {
            report_id: reportId,
            status: "ACTIVE"
        }
    });

    if (!record) {
        return null;
    }

    return MissionMapper.toDomain(record);
}

async update(mission: Mission): Promise<void> {

    await this.prisma.mission.update({

        where: {
            mission_id: mission.missionId!
        },

        data: {
            latitude: mission.latitude,
            longitude: mission.longitude,
            radius: mission.radius,
              title: mission.title,
        description: mission.description,
            status: mission.status
        }

    });

}



}