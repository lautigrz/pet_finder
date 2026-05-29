import { createHash } from "node:crypto";
import { RefreshToken } from "../../domain/entities/RefreshToken";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import prisma from "../prisma/prisma.client";
import { RefreshTokenMapper } from "./RefreshTokenMapper";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async save(token: RefreshToken): Promise<void> {
    await prisma.refreshToken.create({
      data: RefreshTokenMapper.toPersistence(token, hashValue(token.value)),
    });
  }

  async findByValue(value: string): Promise<RefreshToken | null> {
    const record = await prisma.refreshToken.findUnique({ where: { token: hashValue(value) } });
    return record ? RefreshTokenMapper.toDomain(record) : null;
  }

  async revoke(tokenId: number, revokedAt: Date): Promise<void> {
    await prisma.refreshToken.update({
      where: { refresh_token_id: tokenId },
      data: { revoked_at: revokedAt },
    });
  }
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
