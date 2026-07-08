import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { AchievementOutput } from "./get-user-experience.output";
import { GetUserExperienceOutput } from "./get-user-experience.output";

const XP_PER_LEVEL = 100;
const RECENT_EVENTS_LIMIT = 10;

@injectable()
export class GetUserExperienceUseCase {
  constructor(
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,
    @inject("UserExperienceRepository")
    private readonly userExperienceRepository: IUserExperienceRepository,
  ) {}

  async execute(publicUserId: string): Promise<GetUserExperienceOutput> {
    const user = await this.userRepository.findByPublicId(publicUserId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const xp = user.exp;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const definitions = await this.userExperienceRepository.findAchievementDefinitions();
    const achievements: AchievementOutput[] = definitions.map((definition) => ({
      ...definition,
      unlocked: xp >= definition.requiredXp,
    }));
    const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
    const recentEvents = await this.userExperienceRepository.findRecentEvents(publicUserId, RECENT_EVENTS_LIMIT);

    return new GetUserExperienceOutput(
      xp,
      level,
      achievements,
      unlockedAchievements,
      recentEvents.map((event) => ({
        action: event.action,
        amount: event.amount,
        occurredAt: event.occurredAt.toISOString(),
      })),
    );
  }
}
