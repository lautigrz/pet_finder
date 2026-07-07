import { createHash } from "node:crypto";
import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";

import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { RefreshTokenMapper } from "./refresh-token.mapper";

@injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {

  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient) { }


  async save(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: RefreshTokenMapper.toPersistence(token, hashValue(token.value)),
    });
  }

  async findByValue(value: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { token: hashValue(value) } });
    return record ? RefreshTokenMapper.toDomain(record) : null;
  }

  async revoke(tokenId: number, revokedAt: Date): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { refresh_token_id: tokenId },
      data: { revoked_at: revokedAt },
    });
  }

  async revokeAllByUser(userId: number, revokedAt: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: revokedAt },
    });
  }
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
