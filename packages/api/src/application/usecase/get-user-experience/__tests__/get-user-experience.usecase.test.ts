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
      expect.objectContaining({ code: "FIRST_STEPS", requiredXp: 10, unlocked: true }),
      expect.objectContaining({ code: "ACTIVE_HELPER", requiredXp: 50, unlocked: true }),
      expect.objectContaining({ code: "COMMUNITY_ALLY", requiredXp: 100, unlocked: true }),
      expect.objectContaining({ code: "PET_GUARDIAN", requiredXp: 250, unlocked: false }),
    ]);
    expect(result.unlockedAchievements.map((achievement) => achievement.code)).toEqual([
      "FIRST_STEPS",
      "ACTIVE_HELPER",
      "COMMUNITY_ALLY",
    ]);
    expect(result.recentEvents).toEqual([
      {
        action: UserExpAction.CREATE_SIGHTING_REPORT,
        amount: 35,
        occurredAt: "2026-07-06T10:00:00.000Z",
      },
    ]);
    expect(userRepository.findByPublicId).toHaveBeenCalledWith("user-123");
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
