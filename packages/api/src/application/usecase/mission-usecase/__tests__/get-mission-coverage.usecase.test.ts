import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMissionCoverageUseCase } from "../get-mission-coverage.usecase";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import type { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";

describe("GetMissionCoverageUseCase", () => {
  let mockMissionRepository: any;
  let mockMissionCoverageRepository: any;
  let usecase: GetMissionCoverageUseCase;

  beforeEach(() => {
    mockMissionRepository = {
      findByPublicId: vi.fn(),
    };
    mockMissionCoverageRepository = {
      getCoverage: vi.fn(),
    };
    usecase = new GetMissionCoverageUseCase(mockMissionRepository, mockMissionCoverageRepository);
  });

  it("debe retornar la cobertura de la misión correctamente", async () => {
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

    const mockResult = {
      cells: ["cell-1", "cell-2"],
      lastSyncTimestamp: new Date("2026-07-10T12:00:00Z"),
    };

    mockMissionRepository.findByPublicId.mockResolvedValue(mission);
    mockMissionCoverageRepository.getCoverage.mockResolvedValue(mockResult);

    const result = await usecase.execute("mission-uuid", new Date("2026-07-10T11:00:00Z"));

    expect(result).toEqual(mockResult);
    expect(mockMissionRepository.findByPublicId).toHaveBeenCalledWith("mission-uuid");
    expect(mockMissionCoverageRepository.getCoverage).toHaveBeenCalledWith(100, new Date("2026-07-10T11:00:00Z"));
  });

  it("debe lanzar MissionNotFoundError si la misión no existe", async () => {
    mockMissionRepository.findByPublicId.mockResolvedValue(null);

    await expect(usecase.execute("non-existent")).rejects.toThrow(MissionNotFoundError);
  });
});
