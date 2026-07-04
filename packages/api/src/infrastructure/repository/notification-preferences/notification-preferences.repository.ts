import { INotificationPreferencesRepository, UpdateNotificationPreferencesData } from "../../../domain/repositories/INotificationPreferencesRepository";
import { NotificationPreference } from "../../../domain/entities/NotificationPreference";
import { NotificationPreferencesMapper } from "./notification-preferences.mapper";
import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";

@injectable()
export class PrismaNotificationPreferencesRepository implements INotificationPreferencesRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async getOrCreateByUserPublicId(
        userPublicId: string,
    ): Promise<NotificationPreference> {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        const record = await this.prisma.notificationPreference.upsert({
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

    async updateByUserPublicId(
        userPublicId: string,
        data: UpdateNotificationPreferencesData,
    ): Promise<NotificationPreference> {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        const preferenceData = {
            ...(data.notificationRadius !== undefined
                ? { notification_radius: data.notificationRadius }
                : {}),
            ...(data.lostReportsEnabled !== undefined
                ? { lost_reports_enabled: data.lostReportsEnabled }
                : {}),
            ...(data.sightingReportsEnabled !== undefined
                ? { sighting_reports_enabled: data.sightingReportsEnabled }
                : {}),
            ...(data.matchesEnabled !== undefined
                ? { matches_enabled: data.matchesEnabled }
                : {}),
            ...(data.mutedUntil !== undefined
                ? { notifications_muted_until: data.mutedUntil }
                : {}),
        };

        const record = await this.prisma.notificationPreference.upsert({
            where: {
                user_id: user.user_id,
            },
            update: preferenceData,
            create: {
                user_id: user.user_id,
                ...preferenceData,
            },
        });

        return NotificationPreferencesMapper.toDomain(record);
    }
}
