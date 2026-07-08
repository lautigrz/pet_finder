import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { MissionUpdate } from "@domain/mission/MissionUpdate";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";
import { MissionUpdateMapper } from "./mission-update.mapper";

@injectable()
export class PrismaMissionUpdateRepository implements MissionUpdateRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) { }

  async save(update: MissionUpdate): Promise<number> {

    const missionUpdate = MissionUpdateMapper.toPersistence(update);

    const created = await this.prisma.missionUpdate.create({
      data: missionUpdate
    });

    return created.update_id;
  }

  async findByMissionId(missionId: number): Promise<MissionUpdate[]> {
    const records = await this.prisma.missionUpdate.findMany({
      where: {
        mission_id: missionId
      },
      orderBy: {
        created_at: "desc"
      }
    });

    return records.map(record =>
      MissionUpdateMapper.toDomain(record)
    );
  }

  async findByUser(userId: number): Promise<any[]> {
    return this.prisma.missionUpdate.findMany({
      where: {
        user_id: userId
      },
      include: {
        mission: {
          include: {
            report: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });
  }
}
