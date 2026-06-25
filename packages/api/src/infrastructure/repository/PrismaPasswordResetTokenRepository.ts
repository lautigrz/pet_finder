import { createHash } from "node:crypto";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";
import { PasswordResetTokenMapper } from "./PasswordResetTokenMapper";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient) { }

  async save(token: PasswordResetToken): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: PasswordResetTokenMapper.toPersistence(token, hashValue(token.value)),
    });
  }

  async findByValue(value: string): Promise<PasswordResetToken | null> {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { token: hashValue(value) },
    });
    return record ? PasswordResetTokenMapper.toDomain(record) : null;
  }

  async markAsUsed(tokenId: number, usedAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { password_reset_token_id: tokenId },
      data: { used_at: usedAt },
    });
  }
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
