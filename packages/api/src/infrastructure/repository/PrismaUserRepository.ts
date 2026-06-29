import { PrismaClient } from "@prisma/client";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserMapper } from "./UserMapper";
import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaUserRepository implements IUserRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient
  ) { }

  async findByIds(userInternalIds: number[]): Promise<{ user_id: number, public_id: string, username: string, photoUrl: string | null }[]> {
    const users = await this.prisma.user.findMany({
      where: { user_id: { in: userInternalIds } },
      select: { user_id: true, public_id: true, username: true, photo_url: true },
    });
    return users.map((user) => ({ user_id: user.user_id, public_id: user.public_id, username: user.username, photoUrl: user.photo_url }));
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

  async updatePassword(internalUserId: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: internalUserId },
      data: { password: passwordHash },
    });
  }

  async deleteById(internalUserId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { user_id: internalUserId } }),
      this.prisma.user.delete({ where: { user_id: internalUserId } }),
    ]);
  }
}
