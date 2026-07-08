import { User } from "../entities/User";
import type { UserExpAction } from "../entities/UserExpAction";

export interface UserExperienceEvent {
  action: UserExpAction;
  amount: number;
  occurredAt: Date;
}

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  requiredXp: number;
  icon: string | null;
}

export interface IUserExperienceRepository {
  addExp(publicId: string, action: UserExpAction, amount: number): Promise<User>;
  findRecentEvents(publicId: string, limit: number): Promise<UserExperienceEvent[]>;
  findAchievementDefinitions(): Promise<AchievementDefinition[]>;
}
