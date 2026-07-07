import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { AchievementOutput } from "./get-user-experience.output";
import { GetUserExperienceOutput } from "./get-user-experience.output";

const XP_PER_LEVEL = 100;
const RECENT_EVENTS_LIMIT = 10;

const ACHIEVEMENTS: AchievementOutput[] = [
  {
    code: "FIRST_RESCUE",
    name: "Primer rescate",
    description: "Alcanzá 10 XP colaborando en la comunidad.",
    requiredXp: 10,
    icon: "🐾",
    unlocked: false,
  },
  {
    code: "SOLIDARY_NEIGHBOR",
    name: "Vecino solidario",
    description: "Alcanzá 50 XP aportando a búsquedas y reportes.",
    requiredXp: 50,
    icon: "🏠",
    unlocked: false,
  },
  {
    code: "URBAN_EXPLORER",
    name: "Explorador urbano",
    description: "Alcanzá 100 XP ayudando a reunir mascotas con sus familias.",
    requiredXp: 100,
    icon: "👁️",
    unlocked: false,
  },
  {
    code: "GIANT_HEART",
    name: "Corazón gigante",
    description: "Alcanzá 250 XP sosteniendo la red de ayuda.",
    requiredXp: 250,
    icon: "❤️",
    unlocked: false,
  },
  {
    code: "WEEKLY_STREAK",
    name: "Racha semanal",
    description: "Alcanzá 500 XP manteniendo actividad constante.",
    requiredXp: 500,
    icon: "🔥",
    unlocked: false,
  },
  {
    code: "COMMUNITY_BOND",
    name: "Vínculo comunitario",
    description: "Alcanzá 750 XP fortaleciendo la red de ayuda.",
    requiredXp: 750,
    icon: "🔗",
    unlocked: false,
  },
  {
    code: "FREQUENT_SIGHTER",
    name: "Avistador frecuente",
    description: "Alcanzá 1000 XP participando activamente en reportes.",
    requiredXp: 1000,
    icon: "👁️",
    unlocked: false,
  },
  {
    code: "CERTIFIED_CAREGIVER",
    name: "Cuidador certificado",
    description: "Alcanzá 1250 XP demostrando compromiso con la comunidad.",
    requiredXp: 1250,
    icon: "🛡️",
    unlocked: false,
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
