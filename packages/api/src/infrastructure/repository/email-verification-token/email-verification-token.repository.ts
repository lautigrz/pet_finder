import { PrismaClient } from "@prisma/client";
import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";
import { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";

import { inject, injectable } from "tsyringe";
import { EmailVerificationTokenMapper } from "./email-verification-token.mapper";

@injectable()
export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient) { }

  async save(token: EmailVerificationToken): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: EmailVerificationTokenMapper.toPersistence(token),
    });
  }

  async findByValue(value: string): Promise<EmailVerificationToken | null> {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { token: value } });
    return record ? EmailVerificationTokenMapper.toDomain(record) : null;
  }

  async markAsUsed(tokenId: number, usedAt: Date): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { email_verification_token_id: tokenId },
      data: { used_at: usedAt },
    });
  }
}
