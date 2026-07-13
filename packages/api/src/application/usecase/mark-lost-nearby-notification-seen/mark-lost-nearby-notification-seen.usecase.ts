import { inject, injectable } from "tsyringe";

import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

import { MarkLostNearbyNotificationSeenInput } from "./mark-lost-nearby-notification-seen.input";

@injectable()
export class MarkLostNearbyNotificationSeenUseCase {
  constructor(
    @inject("LostNearbyNotificationRepository")
    private readonly repository: ILostNearbyNotificationRepository,
  ) {}

  async execute(
    input: MarkLostNearbyNotificationSeenInput,
  ): Promise<void> {
    await this.repository.markAsSeen(
      input.notificationPublicId,
    );
  }
}