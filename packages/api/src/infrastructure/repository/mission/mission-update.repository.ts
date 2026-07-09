import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { MissionUpdate } from "@domain/mission/MissionUpdate";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";
import { MissionUpdateMapper } from "./mission-update.mapper";
import { PointValue } from "@domain/mission/value-objects/point-value.vo";

@injectable()
export class PrismaMissionUpdateRepository implements MissionUpdateRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) { }



  async update(update: MissionUpdate): Promise<void> {
    let pointValueId: number | null = null;

    if (update.pointValue) {
      const point = await this.prisma.pointValue.findUnique({
        where: {
          points: update.pointValue.points,
        },
      });

      if (!point) {
        throw new Error("Point value not found");
      }

      pointValueId = point.point_value_id;
    }

    const missionUpdate = MissionUpdateMapper.toPersistence(
      update,
      pointValueId ?? undefined
    );

    await this.prisma.missionUpdate.update({
      where: {
        update_id: update.updateId!,
      },
      data: missionUpdate,
    });
  }

  async findPointByContext(context: string): Promise<PointValue[]> {
    const results = await this.prisma.pointValue.findMany({
      where: {
        contexts: {
          some: {
            context,
          },
        },
      },
    });

    return results.map(result =>
      PointValue.create({
        points: result.points,
        label: result.label ?? "",
      })
    );
  }

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
      include: {
        pointValue: true
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

  async findByPublicId(publicId: string): Promise<MissionUpdate | null> {
    const record = await this.prisma.missionUpdate.findUnique({
      where: {
        public_id: publicId,
      },
      include: {
        pointValue: true,
      },
    });

    if (!record) {
      return null;
    }

    return MissionUpdateMapper.toDomain(record);
  }
}
