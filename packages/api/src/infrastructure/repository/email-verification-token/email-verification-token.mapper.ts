import { EmailVerificationToken as TokenPrisma } from "@prisma/client";
import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";

export class EmailVerificationTokenMapper {
  static toDomain(record: TokenPrisma): EmailVerificationToken {
    return EmailVerificationToken.reconstruct(
      record.email_verification_token_id,
      record.user_id,
      record.token,
      record.expires_at,
      record.used_at,
      record.created_at,
    );
  }

  static toPersistence(token: EmailVerificationToken) {
    return {
      user_id: token.userId,
      token: token.value,
      expires_at: token.expiresAt,
    };
  }
}
