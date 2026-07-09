import { describe, expect, it, vi } from "vitest";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { User } from "@domain/entities/User";
import { UserExpAction } from "@domain/entities/UserExpAction";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { GetUserExperienceUseCase } from "../get-user-experience.usecase";

describe("GetUserExperienceUseCase", () => {
  it("returns xp, level and unlocked achievements for the user", async () => {
    const userRepository = {
      findByPublicId: vi.fn().mockResolvedValue(
        User.reconstruct(1, "user-123", "facu@test.com", "facu", "hashed-password", true, new Date(), null, null, null, false, 120),
      ),
    } as unknown as IUserRepository;
    const userExperienceRepository = {
      findAchievementDefinitions: vi.fn().mockResolvedValue([
        {
          code: "FIRST_RESCUE",
          name: "Primer rescate",
          description: "Alcanzo 10 XP colaborando en la comunidad.",
          requiredXp: 10,
          icon: "🐾",
        },
        {
          code: "SOLIDARY_NEIGHBOR",
          name: "Vecino solidario",
          description: "Alcanzo 50 XP aportando a busquedas y reportes.",
          requiredXp: 50,
          icon: "🏠",
        },
        {
          code: "URBAN_EXPLORER",
          name: "Explorador urbano",
          description: "Alcanzo 100 XP ayudando a reunir mascotas con sus familias.",
          requiredXp: 100,
          icon: "👁️",
        },
        {
          code: "GIANT_HEART",
          name: "Corazón gigante",
          description: "Alcanzo 250 XP sosteniendo la red de ayuda.",
          requiredXp: 250,
          icon: "❤️",
        },
        {
          code: "COMMUNITY_BOND",
          name: "Vínculo comunitario",
          description: "Alcanzo 750 XP fortaleciendo la red de ayuda.",
          requiredXp: 750,
          icon: "🔗",
        },
        {
          code: "FREQUENT_SIGHTER",
          name: "Avistador frecuente",
          description: "Alcanzo 1000 XP participando activamente en reportes.",
          requiredXp: 1000,
          icon: "👁️",
        },
        {
          code: "CERTIFIED_CAREGIVER",
          name: "Cuidador certificado",
          description: "Alcanzo 1250 XP demostrando compromiso con la comunidad.",
          requiredXp: 1250,
          icon: "🛡️",
        },
      ]),
      findRecentEvents: vi.fn().mockResolvedValue([
        {
          action: UserExpAction.CREATE_SIGHTING_REPORT,
          amount: 35,
          occurredAt: new Date("2026-07-06T10:00:00.000Z"),
        },
      ]),
    } as unknown as IUserExperienceRepository;
    const useCase = new GetUserExperienceUseCase(userRepository, userExperienceRepository);

    const result = await useCase.execute("user-123");

    expect(result.xp).toBe(120);
    expect(result.totalXp).toBe(120);
    expect(result.level).toBe(2);
    expect(result.achievements).toEqual([
      expect.objectContaining({ code: "FIRST_RESCUE", requiredXp: 10, unlocked: true, icon: "🐾" }),
      expect.objectContaining({ code: "SOLIDARY_NEIGHBOR", requiredXp: 50, unlocked: true, icon: "🏠" }),
      expect.objectContaining({ code: "URBAN_EXPLORER", requiredXp: 100, unlocked: true, icon: "👁️" }),
      expect.objectContaining({ code: "GIANT_HEART", requiredXp: 250, unlocked: false, icon: "❤️" }),
      expect.objectContaining({ code: "COMMUNITY_BOND", requiredXp: 750, unlocked: false, icon: "🔗" }),
      expect.objectContaining({ code: "FREQUENT_SIGHTER", requiredXp: 1000, unlocked: false, icon: "👁️" }),
      expect.objectContaining({ code: "CERTIFIED_CAREGIVER", requiredXp: 1250, unlocked: false, icon: "🛡️" }),
    ]);
    expect(result.unlockedAchievements.map((achievement) => achievement.code)).toEqual([
      "FIRST_RESCUE",
      "SOLIDARY_NEIGHBOR",
      "URBAN_EXPLORER",
    ]);
    expect(result.recentEvents).toEqual([
      {
        action: UserExpAction.CREATE_SIGHTING_REPORT,
        amount: 35,
        occurredAt: "2026-07-06T10:00:00.000Z",
      },
    ]);
    expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-123");
    expect(userExperienceRepository.findAchievementDefinitions).toHaveBeenCalled();
    expect(userExperienceRepository.findRecentEvents).toHaveBeenCalledWith("user-123", 10);
  });

  it("throws UserNotFoundError when the user does not exist", async () => {
    const userRepository = {
      findByPublicId: vi.fn().mockResolvedValue(null),
    } as unknown as IUserRepository;
    const userExperienceRepository = {
      findRecentEvents: vi.fn(),
    } as unknown as IUserExperienceRepository;
    const useCase = new GetUserExperienceUseCase(userRepository, userExperienceRepository);

    await expect(useCase.execute("missing-user")).rejects.toThrow(UserNotFoundError);
    expect(userExperienceRepository.findRecentEvents).not.toHaveBeenCalled();
  });
});
