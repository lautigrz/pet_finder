import { EmailVerificationToken } from "../entities/EmailVerificationToken";

export interface IEmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findByValue(value: string): Promise<EmailVerificationToken | null>;
  markAsUsed(tokenId: number, usedAt: Date): Promise<void>;
}
