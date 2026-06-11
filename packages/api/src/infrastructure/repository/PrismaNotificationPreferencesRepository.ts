import { INotificationPreferencesRepository, UpdateNotificationPreferencesData } from "../../domain/repositories/INotificationPreferencesRepository";
import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import prisma from "../prisma/prisma.client";
import { NotificationPreferencesMapper } from "./NotificationPreferencesMapper";

export class PrismaNotificationPreferencesRepository implements INotificationPreferencesRepository {
    async getOrCreateByUserPublicId(
        userPublicId: string,
    ): Promise<NotificationPreference> {
        const user = await prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        const record = await prisma.notificationPreference.upsert({
            where: {
                user_id: user.user_id,
            },
            update: {},
            create: {
                user_id: user.user_id,
            },
        });

        return NotificationPreferencesMapper.toDomain(record);
    }

    async updateByUserPublicId(userPublicId: string, data: UpdateNotificationPreferencesData): Promise<NotificationPreference> {
        const record = await prisma.notificationPreference.update({
            where: {
                user_id: (
                    await prisma.user.findUniqueOrThrow({
                        where: { public_id: userPublicId },
                        select: { user_id: true },
                    })
                ).user_id,
            },
            data: {
                notification_radius: data.notificationRadius,
                lost_reports_enabled: data.lostReportsEnabled,
                sighting_reports_enabled: data.sightingReportsEnabled,
                matches_enabled: data.matchesEnabled,
                notifications_muted_until: data.mutedUntil,
            },
        });

        return NotificationPreferencesMapper.toDomain(record);
    }
}