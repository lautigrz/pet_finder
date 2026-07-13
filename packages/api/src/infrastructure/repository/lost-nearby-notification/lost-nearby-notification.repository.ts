import { PrismaClient } from "@prisma/client";

import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";
import { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

import { LostNearbyNotificationMapper } from "./lost-nearby-notification.mapper";

import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaLostNearbyNotificationRepository
  implements ILostNearbyNotificationRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient,
  ) {}

  async save(
    notification: LostNearbyNotification,
  ): Promise<LostNearbyNotification> {
    const record =
      await this.prisma.lostNearbyNotification.create({
        data: LostNearbyNotificationMapper.toPersistence(
          notification,
        ),
      });

    return LostNearbyNotificationMapper.toDomain(record);
  }

  async findByUserPublicId(
    userPublicId: string,
  ): Promise<LostNearbyNotification[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        public_id: userPublicId,
      },
      select: {
        user_id: true,
      },
    });

    const records =
      await this.prisma.lostNearbyNotification.findMany({
        where: {
          user_id: user.user_id,
        },
        orderBy: {
          created_at: "desc",
        },
      });

    return records.map(
      LostNearbyNotificationMapper.toDomain,
    );
  }

  async markAsSeen(
    notificationPublicId: string,
  ): Promise<void> {
    await this.prisma.lostNearbyNotification.update({
      where: {
        public_id: notificationPublicId,
      },
      data: {
        seen: true,
      },
    });
  }
}