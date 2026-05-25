import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import prisma from "../prisma/prisma.client";
import { UserMapper } from "./UserMapper";

export class PrismaUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    const record = await prisma.user.create({ data: UserMapper.toPersistence(user) });
    return UserMapper.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async markVerified(internalUserId: number): Promise<void> {
    await prisma.user.update({
      where: { user_id: internalUserId },
      data: { is_verified: true },
    });
  }
}
