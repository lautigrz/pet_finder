import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { MissionResponse } from "@domain/mission-response/MissionResponse";
import type { MissionResponseRepository } from "@domain/repositories/mission-response.repository";
import { MissionResponseMapper } from "./MissionResponseMapper";

@injectable()
export class PrismaMissionResponseRepository implements MissionResponseRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) {}
 

  async save(response: MissionResponse): Promise<number> {

    const created = await this.prisma.missionResponse.create({

      data: {

        mission_id: response.missionId,

        user_id: response.userId,

        comment: response.comment,

        photo_url: response.photoUrl,

        status: response.status

      }

    });

    return created.response_id;

  }


  async findByMissionId(missionId: number): Promise<MissionResponse[]> {

    const records = await this.prisma.missionResponse.findMany({

      where: {
        mission_id: missionId
      },

      orderBy: {
        created_at: "desc"
      }

    });

    return records.map(record =>
      MissionResponseMapper.toDomain(record)
    );

  }

  async findByUser(userId: number): Promise<any[]> {

  return this.prisma.missionResponse.findMany({

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

