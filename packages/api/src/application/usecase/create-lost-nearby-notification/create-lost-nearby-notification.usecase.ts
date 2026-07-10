import { inject, injectable } from "tsyringe";

import {LOST_NEARBY_EVENT,  type LostNearbySocketNotification} from "@pet-alert/shared";

import { emitToUser } from "@infrastructure/websocket/socket";

import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";
import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

import { CreateLostNearbyNotificationInput } from "./create-lost-nearby-notification.input";

@injectable()
export class CreateLostNearbyNotificationUseCase {
  constructor(
    @inject("LostNearbyNotificationRepository")
    private readonly lostNearbyNotificationRepository: ILostNearbyNotificationRepository,
  ) {}

  async execute(
    input: CreateLostNearbyNotificationInput,
  ): Promise<LostNearbyNotification> {

    const notification = LostNearbyNotification.create({
      userId: input.userId,
      reportPublicId: input.reportPublicId,
      petName: input.petName,
      reportImage: input.reportImage,
      reportAddress: input.reportAddress,
      title: input.title,
      body: input.body,
    });

    const saved =
      await this.lostNearbyNotificationRepository.save(
        notification,
      );

    const socketNotification: LostNearbySocketNotification = {
      userPublicId: input.userPublicId,
      notificationPublicId: saved.publicId,
      reportPublicId: saved.reportPublicId,
      petName: saved.petName,
      reportImage: saved.reportImage,
      reportAddress: saved.reportAddress,
      title: saved.title,
      body: saved.body,
      seen: saved.seen,
      createdAt: saved.createdAt.toISOString(),
    };

    emitToUser(
      input.userPublicId,
      LOST_NEARBY_EVENT,
      socketNotification,
    );

    return saved;
  }
}