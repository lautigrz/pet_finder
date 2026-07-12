import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";

@injectable()
export class PrismaMissionCoverageRepository implements MissionCoverageRepository {
  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) {}

  async saveCoverage(missionId: number, userId: number, cells: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const cell of cells) {
        await tx.missionCoverage.upsert({
          where: {
            mission_id_user_id_geohash_cell: {
              mission_id: missionId,
              user_id: userId,
              geohash_cell: cell
            }
          },
          update: {
            last_visited_at: new Date()
          },
          create: {
            mission_id: missionId,
            user_id: userId,
            geohash_cell: cell,
            first_visited_at: new Date(),
            last_visited_at: new Date()
          }
        });
      }
    });
  }

  async getCoverage(missionId: number, since?: Date): Promise<{ cells: string[]; lastSyncTimestamp: Date }> {
    const lastSyncTimestamp = new Date();
    
    const records = await this.prisma.missionCoverage.findMany({
      where: {
        mission_id: missionId,
        ...(since ? { last_visited_at: { gt: since } } : {})
      },
      select: {
        geohash_cell: true
      }
    });

    const cells = records.map(r => r.geohash_cell);
    return { cells, lastSyncTimestamp };
  }
}
