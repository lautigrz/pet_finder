import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { AchievementOutput, UnlockedAchievementOutput } from "./get-user-experience.output";
import { GetUserExperienceOutput } from "./get-user-experience.output";

const XP_PER_LEVEL = 100;
const RECENT_EVENTS_LIMIT = 10;

const ACHIEVEMENTS: UnlockedAchievementOutput[] = [
  {
    code: "FIRST_STEPS",
    name: "Primeros pasos",
    description: "Alcanzo 10 XP colaborando en la comunidad.",
    requiredXp: 10,
  },
  {
    code: "ACTIVE_HELPER",
    name: "Ayudante activo",
    description: "Alcanzo 50 XP aportando a busquedas y reportes.",
    requiredXp: 50,
  },
  {
    code: "COMMUNITY_ALLY",
    name: "Aliado de la comunidad",
    description: "Alcanzo 100 XP ayudando a reunir mascotas con sus familias.",
    requiredXp: 100,
  },
  {
    code: "PET_GUARDIAN",
    name: "Guardian de mascotas",
    description: "Alcanzo 250 XP sosteniendo la red de ayuda.",
    requiredXp: 250,
  },
];

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
    const achievements: AchievementOutput[] = ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: xp >= achievement.requiredXp,
    }));
    const unlockedAchievements = achievements
      .filter((achievement) => achievement.unlocked)
      .map(({ unlocked: _unlocked, ...achievement }) => achievement);
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
