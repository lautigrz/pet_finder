import { EmailVerificationToken } from "../../domain/entities/EmailVerificationToken";
import { IEmailVerificationTokenRepository } from "../../domain/repositories/IEmailVerificationTokenRepository";
import prisma from "../prisma/prisma.client";
import { EmailVerificationTokenMapper } from "./EmailVerificationTokenMapper";

export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  async save(token: EmailVerificationToken): Promise<void> {
    await prisma.emailVerificationToken.create({
      data: EmailVerificationTokenMapper.toPersistence(token),
    });
  }

  async findByValue(value: string): Promise<EmailVerificationToken | null> {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token: value } });
    return record ? EmailVerificationTokenMapper.toDomain(record) : null;
  }

  async markAsUsed(tokenId: number, usedAt: Date): Promise<void> {
    await prisma.emailVerificationToken.update({
      where: { email_verification_token_id: tokenId },
      data: { used_at: usedAt },
    });
  }
}
