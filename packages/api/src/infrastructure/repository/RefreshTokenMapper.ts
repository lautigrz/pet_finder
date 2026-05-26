import { RefreshToken as RefreshTokenPrisma } from "@prisma/client";
import { RefreshToken } from "../../domain/entities/RefreshToken";

export class RefreshTokenMapper {
  static toDomain(record: RefreshTokenPrisma): RefreshToken {
    return RefreshToken.reconstruct(
      record.refresh_token_id,
      record.user_id,
      record.token,
      record.expires_at,
      record.revoked_at,
      record.created_at,
    );
  }

  static toPersistence(token: RefreshToken, hashedValue: string) {
    return {
      user_id: token.userId,
      token: hashedValue,
      expires_at: token.expiresAt,
    };
  }
}
