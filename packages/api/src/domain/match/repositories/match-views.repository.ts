export interface MatchViewsRepository {
  markSeen(userPublicId: string, matchPublicId: string): Promise<void>;
  findSeenMatchPublicIdsByUser(userPublicId: string): Promise<string[]>;
}
