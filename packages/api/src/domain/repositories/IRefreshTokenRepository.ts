import { RefreshToken } from "../entities/RefreshToken";

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByValue(value: string): Promise<RefreshToken | null>;
  revoke(tokenId: number, revokedAt: Date): Promise<void>;
  revokeAllByUser(userId: number, revokedAt: Date): Promise<void>;
}
