import type { UserExpAction } from "@domain/entities/UserExpAction";

export interface AchievementOutput {
  code: string;
  name: string;
  description: string;
  requiredXp: number;
  icon?: string | null;
  unlocked: boolean;
}

export type UnlockedAchievementOutput = Omit<AchievementOutput, "unlocked">;

export interface RecentExperienceEventOutput {
  action: UserExpAction;
  amount: number;
  occurredAt: string;
}

export class GetUserExperienceOutput {
  public readonly xp: number;

  constructor(
    public readonly totalXp: number,
    public readonly level: number,
    public readonly achievements: AchievementOutput[],
    public readonly unlockedAchievements: UnlockedAchievementOutput[],
    public readonly recentEvents: RecentExperienceEventOutput[],
  ) {
    this.xp = totalXp;
  }
}
