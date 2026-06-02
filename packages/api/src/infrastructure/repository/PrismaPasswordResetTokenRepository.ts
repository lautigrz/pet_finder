import { createHash } from "node:crypto";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";
import prisma from "../prisma/prisma.client";
import { PasswordResetTokenMapper } from "./PasswordResetTokenMapper";

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async save(token: PasswordResetToken): Promise<void> {
    await prisma.passwordResetToken.create({
      data: PasswordResetTokenMapper.toPersistence(token, hashValue(token.value)),
    });
  }

  async findByValue(value: string): Promise<PasswordResetToken | null> {
    const record = await prisma.passwordResetToken.findFirst({
      where: { token: hashValue(value) },
    });
    return record ? PasswordResetTokenMapper.toDomain(record) : null;
  }

  async markAsUsed(tokenId: number, usedAt: Date): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { password_reset_token_id: tokenId },
      data: { used_at: usedAt },
    });
  }
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
