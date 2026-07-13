import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";

export class GetLostNearbyNotificationsOutput {
  constructor(
    public readonly notificationPublicId: string,
    public readonly reportPublicId: string,
    public readonly petName: string | null,
    public readonly reportImage: string | null,
    public readonly reportAddress: string | null,
    public readonly title: string,
    public readonly body: string,
    public readonly seen: boolean,
    public readonly createdAt: Date,
  ) {}

  static fromDomain(
    notification: LostNearbyNotification,
  ): GetLostNearbyNotificationsOutput {
    return new GetLostNearbyNotificationsOutput(
      notification.publicId,
      notification.reportPublicId,
      notification.petName,
      notification.reportImage,
      notification.reportAddress,
      notification.title,
      notification.body,
      notification.seen,
      notification.createdAt,
    );
  }
}