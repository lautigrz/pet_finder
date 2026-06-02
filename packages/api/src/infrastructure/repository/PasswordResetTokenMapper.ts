import { PasswordResetToken as TokenPrisma } from "@prisma/client";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken";

export class PasswordResetTokenMapper {
  static toDomain(record: TokenPrisma): PasswordResetToken {
    return PasswordResetToken.reconstruct(
      record.password_reset_token_id,
      record.user_id,
      record.token,
      record.expires_at,
      record.used_at,
      record.created_at,
    );
  }

  static toPersistence(token: PasswordResetToken, hashedValue: string) {
    return {
      user_id: token.userId,
      token: hashedValue,
      expires_at: token.expiresAt,
    };
  }
}
