import { inject, injectable } from "tsyringe";

import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

import { GetLostNearbyNotificationsOutput } from "./get-lost-nearby-notifications.output";

@injectable()
export class GetLostNearbyNotificationsUseCase {
  constructor(
    @inject("LostNearbyNotificationRepository")
    private readonly lostNearbyNotificationRepository: ILostNearbyNotificationRepository,
  ) {}

  async execute(
    userPublicId: string,
  ): Promise<GetLostNearbyNotificationsOutput[]> {
    const notifications =
      await this.lostNearbyNotificationRepository.findByUserPublicId(
        userPublicId,
      );

    return notifications.map(
      GetLostNearbyNotificationsOutput.fromDomain,
    );
  }
}