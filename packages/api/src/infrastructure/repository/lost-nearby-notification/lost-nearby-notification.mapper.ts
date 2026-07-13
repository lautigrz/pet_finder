import { LostNearbyNotification as PrismaLostNearbyNotification } from "@prisma/client";
import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";

export class LostNearbyNotificationMapper {
  static toDomain(
    record: PrismaLostNearbyNotification,
  ): LostNearbyNotification {
    return LostNearbyNotification.restore({
      notificationId: record.lost_nearby_notification_id,
      publicId: record.public_id,
      userId: record.user_id,
      reportPublicId: record.report_public_id,
      petName: record.pet_name,
      reportImage: record.report_image,
      reportAddress: record.report_address,
      title: record.title,
      body: record.body,
      createdAt: record.created_at,
      seen: record.seen,
    });
  }

  static toPersistence(
    notification: LostNearbyNotification,
  ) {
    return {
      public_id: notification.publicId,
      user_id: notification.userId,
      report_public_id: notification.reportPublicId,
      pet_name: notification.petName,
      report_image: notification.reportImage,
      report_address: notification.reportAddress,
      title: notification.title,
      body: notification.body,
      created_at: notification.createdAt,
      seen: notification.seen,
    };
  }
}