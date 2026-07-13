import { PrismaClient } from "@prisma/client";

import { User } from "@domain/entities/User";
import { IUserRepository, UserNotificationTarget, UserProfileStats } from "@domain/repositories/IUserRepository";
import { IGoogleAccountLinker } from "@domain/repositories/IGoogleAccountLinker";

import { UserMapper } from "../user/user.mapper";

import type { AchievementDefinition, IUserExperienceRepository, UserExperienceEvent } from "@domain/repositories/IUserExperienceRepository";
import type { UserExpAction } from "@domain/entities/UserExpAction";

import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaUserRepository implements IUserRepository, IUserExperienceRepository, IGoogleAccountLinker {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) { }

  async findByIds(userInternalIds: number[]): Promise<{ user_id: number, public_id: string, username: string, photoUrl: string | null }[]> {
    const users = await this.prisma.user.findMany({
      where: { user_id: { in: userInternalIds } },
      select: { user_id: true, public_id: true, username: true, photo_url: true },
    });
    return users.map((user: any) => ({ user_id: user.user_id, public_id: user.public_id, username: user.username, photoUrl: user.photo_url }));
  }

  async save(user: User): Promise<User> {
    const record = await this.prisma.user.create({ data: UserMapper.toPersistence(user) });
    return UserMapper.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async markVerified(internalUserId: number): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { is_verified: true },
    });
  }

  async markSuspended(internalUserId: number): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { is_suspended: true },
    });
  }

  async unsuspend(internalUserId: number): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { is_suspended: false },
    });
  }

  async addExp(publicId: string, action: UserExpAction, amount: number): Promise<User> {
    const record = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { public_id: publicId },
        data: { exp: { increment: amount } },
      });

      await tx.userExpEvent.create({
        data: {
          user_id: updatedUser.user_id,
          action,
          amount,
        },
      });

      return updatedUser;
    });

    return UserMapper.toDomain(record);
  }

  async findRecentEvents(publicId: string, limit: number): Promise<UserExperienceEvent[]> {
    const records = await this.prisma.userExpEvent.findMany({
      where: { user: { public_id: publicId } },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return records.map((record) => ({
      action: record.action as UserExpAction,
      amount: record.amount,
      occurredAt: record.created_at,
    }));
  }

  async findAchievementDefinitions(): Promise<AchievementDefinition[]> {
    const records = await this.prisma.achievementDefinition.findMany({
      orderBy: { required_xp: "asc" },
    });

    return records.map((record) => ({
      code: record.code,
      name: record.name,
      description: record.description,
      requiredXp: record.required_xp,
      icon: record.icon,
    }));
  }

  async findById(internalUserId: number): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { user_id: internalUserId } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByPublicId(publicId: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { public_id: publicId },
    });

    return record ? UserMapper.toDomain(record) : null;
  }

  async findNotificationCandidates(): Promise<UserNotificationTarget[]> {
  const users = await this.prisma.user.findMany({
    select: {
      public_id: true,
      last_known_latitude: true,
      last_known_longitude: true,
      last_known_location_at: true,
      role: {
        select: {
          name: true,
        },
      },
      notification_preference: {
        select: {
          notification_radius: true,
          lost_reports_enabled: true,
          notifications_muted_until: true,
        },
      },
    },
  });

  return users
    .filter((user) => user.notification_preference !== null)
    .map((user) => ({
      publicId: user.public_id,
      role: user.role?.name.trim() ?? "",
      lastKnownLatitude:
        user.last_known_latitude === null
          ? null
          : Number(user.last_known_latitude),
      lastKnownLongitude:
        user.last_known_longitude === null
          ? null
          : Number(user.last_known_longitude),
      lastKnownLocationAt: user.last_known_location_at,
      notificationRadius:
        user.notification_preference!.notification_radius,
      lostReportsEnabled:
        user.notification_preference!.lost_reports_enabled,
      mutedUntil:
        user.notification_preference!.notifications_muted_until,
    }));
  }

  async findRoleByPublicId(publicId: string): Promise<string | null> {
    const record = await this.prisma.user.findUnique({
      where: { public_id: publicId },
      select: { role: { select: { name: true } } },
    });
    return record?.role?.name.trim() ?? null;
  }

  async updateProfile(
    publicId: string,
    data: {
      name?: string;
      lastname?: string;
      username?: string;
      photoUrl?: string;
    },
  ): Promise<User> {
    const record = await this.prisma.user.update({
      where: { public_id: publicId },
      data: {
        name: data.name,
        lastname: data.lastname,
        username: data.username,
        photo_url: data.photoUrl
      },
    });

    return UserMapper.toDomain(record);
  }


  async updateCurrentLocation(
    publicId: string,
    latitude: number,
    longitude: number,
    updatedAt: Date
  ): Promise<void> {
    await this.prisma.user.update({
    where: { public_id: publicId },
    data: {
      last_known_latitude: latitude,
      last_known_longitude: longitude,
      last_known_location_at: updatedAt,
    },
  });
}
  async updatePassword(internalUserId: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { password: passwordHash },
    });
  }

  async linkGoogleId(internalUserId: number, googleId: string): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { google_id: googleId },
    });
  }

  async deleteById(internalUserId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { user_id: internalUserId } }),
      this.prisma.user.delete({ where: { user_id: internalUserId } }),
    ]);
  }

  async getProfileStatsByPublicId(publicId:string):Promise <UserProfileStats>{
    const user = await this.prisma.user.findUnique({
      where: { public_id: publicId },
      select: {
        user_id: true,
        created_at: true,
      },
    });

    if(!user){
      return{
        reportsCreated :0,
        successfulReturns:0,
        activeDays:0,
        petsHelped:0
      };
    }

    const [reportsCreated, successfulReturns] = await Promise.all([
      this.prisma.report.count({
        where: {
          user_id: user.user_id,
        },
      }),
      
      this.prisma.report.count({
        where: {
          user_id: user.user_id,
          resolved: true,
        },
      }),
    ]);

    const activeDays = Math.max(1,Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)));
    
    return{
      reportsCreated,
      successfulReturns,
      activeDays,
      petsHelped:0, // De momento no contemplado
    }
  }
}
