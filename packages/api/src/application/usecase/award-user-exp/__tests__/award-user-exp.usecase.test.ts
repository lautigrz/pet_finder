import { describe, expect, it, vi } from "vitest";
import { AwardUserExpUseCase } from "../award-user-exp.usecase";
import { AwardUserExpInput } from "../award-user-exp.input";
import { UserExpAction } from "@domain/entities/UserExpAction";
import { User } from "@domain/entities/User";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";

const VALID_HASH = "$2b$10$abcdefghijklmnopqrstuuJ2uVvKc3m1f0q7c8x9z0a1b2c3d4e5f6";

describe("AwardUserExpUseCase", () => {
  it("suma la experiencia correspondiente a la accion", async () => {
    const repository: IUserExperienceRepository = {
      addExp: vi.fn().mockResolvedValue(
        User.reconstruct(
          1,
          "user-123",
          "user@test.com",
          "usuario",
          VALID_HASH,
          true,
          new Date("2026-01-01"),
          null,
          null,
          null,
          false,
          35,
        ),
      ),
      findRecentEvents: vi.fn(),
    };

    const useCase = new AwardUserExpUseCase(repository);
    const result = await useCase.execute(
      new AwardUserExpInput("user-123", UserExpAction.CREATE_SIGHTING_REPORT),
    );

    expect(repository.addExp).toHaveBeenCalledWith("user-123", UserExpAction.CREATE_SIGHTING_REPORT, 35);
    expect(result).toEqual({
      userPublicId: "user-123",
      action: UserExpAction.CREATE_SIGHTING_REPORT,
      awardedExp: 35,
      totalExp: 35,
    });
  });
});
