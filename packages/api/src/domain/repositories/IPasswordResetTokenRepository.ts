import { PasswordResetToken } from "../entities/PasswordResetToken";

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByValue(value: string): Promise<PasswordResetToken | null>;
  markAsUsed(tokenId: number, usedAt: Date): Promise<void>;
}
