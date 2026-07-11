import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddMissionCoverageUseCase } from "../add-mission-coverage.usecase";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";
import { User } from "@domain/entities/User";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";

describe("AddMissionCoverageUseCase", () => {
  let mockMissionRepository: any;
  let mockUserRepository: any;
  let mockMissionCoverageRepository: any;
  let usecase: AddMissionCoverageUseCase;

  beforeEach(() => {
    mockMissionRepository = {
      findByPublicId: vi.fn(),
    };
    mockUserRepository = {
      findByPublicId: vi.fn(),
    };
    mockMissionCoverageRepository = {
      saveCoverage: vi.fn(),
    };
    usecase = new AddMissionCoverageUseCase(
      mockMissionRepository,
      mockUserRepository,
      mockMissionCoverageRepository
    );
  });

  it("debe guardar la cobertura de la misión correctamente", async () => {
    const mission = Mission.restore({
      missionId: 100,
      publicId: "mission-uuid",
      reportId: 10,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Title",
      description: "Desc",
      status: MissionStatus.IN_PROGRESS,
      volunteerIds: [],
      createdAt: new Date(),
      updatedAt: null,
    });

    const user = User.reconstruct(
      5,
      "user-uuid",
      "test@email.com",
      "username",
      "password",
      true,
      new Date(),
      null,
      null,
      null
    );

    mockMissionRepository.findByPublicId.mockResolvedValue(mission);
    mockUserRepository.findByPublicId.mockResolvedValue(user);
    mockMissionCoverageRepository.saveCoverage.mockResolvedValue(undefined);

    await usecase.execute("mission-uuid", "user-uuid", ["cell-1", "cell-2"]);

    expect(mockMissionRepository.findByPublicId).toHaveBeenCalledWith("mission-uuid");
    expect(mockUserRepository.findByPublicId).toHaveBeenCalledWith("user-uuid");
    expect(mockMissionCoverageRepository.saveCoverage).toHaveBeenCalledWith(100, 5, ["cell-1", "cell-2"]);
  });

  it("debe lanzar MissionNotFoundError si la misión no existe", async () => {
    mockMissionRepository.findByPublicId.mockResolvedValue(null);

    await expect(usecase.execute("non-existent", "user-uuid", [])).rejects.toThrow(MissionNotFoundError);
  });

  it("debe lanzar Error si el usuario no existe", async () => {
    const mission = Mission.restore({
      missionId: 100,
      publicId: "mission-uuid",
      reportId: 10,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Title",
      description: "Desc",
      status: MissionStatus.IN_PROGRESS,
      volunteerIds: [],
      createdAt: new Date(),
      updatedAt: null,
    });

    mockMissionRepository.findByPublicId.mockResolvedValue(mission);
    mockUserRepository.findByPublicId.mockResolvedValue(null);

    await expect(usecase.execute("mission-uuid", "non-existent", [])).rejects.toThrow("User not found");
  });
});
