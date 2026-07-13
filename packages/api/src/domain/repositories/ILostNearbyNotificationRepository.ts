import { LostNearbyNotification } from "../entities/LostNearbyNotification";

export interface ILostNearbyNotificationRepository {
  save(
    notification: LostNearbyNotification,
  ): Promise<LostNearbyNotification>;

  findByUserPublicId(
    userPublicId: string,
  ): Promise<LostNearbyNotification[]>;

  markAsSeen(notificationPublicId: string): Promise<void>;
}