import { NotificationPreference as PrismaNotificationPreference } from "@prisma/client";
import { NotificationPreference } from "../../../domain/entities/NotificationPreference";

export class NotificationPreferencesMapper {
    static toDomain(record: PrismaNotificationPreference,): NotificationPreference {
        return NotificationPreference.reconstruct(
            record.notification_preference_id,
            record.user_id,
            record.notification_radius,
            record.lost_reports_enabled,
            record.sighting_reports_enabled,
            record.matches_enabled,
            record.notifications_muted_until,
            record.created_at,
            record.updated_at
        )
    }
}
