import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreMissionUpdateUseCase } from "../score-mission-update.usecase";
import { Mission } from "@domain/mission/Mission";
import { MissionUpdate } from "@domain/mission/MissionUpdate";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { PointValue } from "@domain/mission/value-objects/point-value.vo";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { User } from "@domain/entities/User";
import { UserExpAction } from "@domain/entities/UserExpAction";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedMissionEditError } from "@domain/errors/UnauthorizedMissionEditError";

describe("ScoreMissionUpdateUseCase Unit Tests", () => {
  let mockMissionUpdateRepository: any;
  let mockMissionRepository: any;
  let mockReportRepository: any;
  let mockUserRepository: any;
  let mockUserExperienceRepository: any;

  beforeEach(() => {
    mockMissionUpdateRepository = {
      findByPublicId: vi.fn(),
      findPointByContext: vi.fn(),
      update: vi.fn()
    };

    mockMissionRepository = {
      findById: vi.fn()
    };

    mockReportRepository = {
      findDetailsByIds: vi.fn()
    };

    mockUserRepository = {
      findByPublicId: vi.fn(),
      findById: vi.fn()
    };

    mockUserExperienceRepository = {
      addExp: vi.fn()
    };
  });

  it("should score a comment and award points successfully if executor is the report owner", async () => {
    const usecase = new ScoreMissionUpdateUseCase(
      mockMissionUpdateRepository,
      mockMissionRepository,
      mockReportRepository,
      mockUserRepository,
      mockUserExperienceRepository
    );

    const mockUpdate = MissionUpdate.restore({
      updateId: 200,
      publicId: "update-uuid",
      missionId: 100,
      userId: 7,
      comment: "Found tracks!",
      photoUrl: null,
      status: "PENDING",
      createdAt: new Date(),
      pointValue: null
    });

    const mockPoints = [
      PointValue.create({ points: 10, label: "Básico" }),
      PointValue.create({ points: 25, label: "Bueno" }),
      PointValue.create({ points: 50, label: "Excelente" })
    ];

    const mockMission = Mission.create({
      reportId: 10,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Search",
      description: "Help"
    });

    const mockExecutor = User.reconstruct(
      5,
      "executor-uuid",
      "owner@email.com",
      "owner",
      "$2b$10$abcdefghijklmnopqrstuv",
      true,
      new Date(),
      null,
      null,
      null
    );

    const mockAuthor = User.reconstruct(
      7,
      "author-uuid",
      "author@email.com",
      "author",
      "$2b$10$abcdefghijklmnopqrstuv",
      true,
      new Date(),
      null,
      null,
      null
    );

    const mockReport = Report.restore({
      idReport: 10,
      publicId: "report-uuid",
      userId: 5, // report owner matching mockExecutor
      userPublicId: "executor-uuid",
      type: ReportType.LOST,
      currentStatus: "ACTIVE" as any,
      description: null,
      location: Location.create({ address: "Address", latitude: -34.6037, longitude: -58.3816 }),
      details: {} as any,
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: null
    });

    mockMissionUpdateRepository.findByPublicId.mockResolvedValue(mockUpdate);
    mockMissionUpdateRepository.findPointByContext.mockResolvedValue(mockPoints);
    mockMissionRepository.findById.mockResolvedValue(mockMission);
    mockUserRepository.findByPublicId.mockResolvedValue(mockExecutor);
    mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);
    mockUserRepository.findById.mockResolvedValue(mockAuthor);
    mockUserExperienceRepository.addExp.mockResolvedValue(mockAuthor);

    await usecase.execute({ updatePublicId: "update-uuid", points: 25 }, "executor-uuid");

    expect(mockUpdate.pointValue?.points).toBe(25);
    expect(mockMissionUpdateRepository.update).toHaveBeenCalledWith(mockUpdate);
    expect(mockUserExperienceRepository.addExp).toHaveBeenCalledWith(
      "author-uuid",
      UserExpAction.VALUED_COMMENT,
      25
    );
  });

  it("should throw error if update has already been scored", async () => {
    const usecase = new ScoreMissionUpdateUseCase(
      mockMissionUpdateRepository,
      mockMissionRepository,
      mockReportRepository,
      mockUserRepository,
      mockUserExperienceRepository
    );

    const mockUpdate = MissionUpdate.restore({
      updateId: 200,
      publicId: "update-uuid",
      missionId: 100,
      userId: 7,
      comment: "Found tracks!",
      photoUrl: null,
      status: "PENDING",
      createdAt: new Date(),
      pointValue: PointValue.create({ points: 10, label: "Básico" })
    });

    mockMissionUpdateRepository.findByPublicId.mockResolvedValue(mockUpdate);

    await expect(
      usecase.execute({ updatePublicId: "update-uuid", points: 25 }, "executor-uuid")
    ).rejects.toThrow("This comment has already been scored");
  });

  it("should throw error if points value is invalid for comment context", async () => {
    const usecase = new ScoreMissionUpdateUseCase(
      mockMissionUpdateRepository,
      mockMissionRepository,
      mockReportRepository,
      mockUserRepository,
      mockUserExperienceRepository
    );

    const mockUpdate = MissionUpdate.restore({
      updateId: 200,
      publicId: "update-uuid",
      missionId: 100,
      userId: 7,
      comment: "Found tracks!",
      photoUrl: null,
      status: "PENDING",
      createdAt: new Date(),
      pointValue: null
    });

    const mockPoints = [
      PointValue.create({ points: 10, label: "Básico" }),
      PointValue.create({ points: 25, label: "Bueno" })
    ];

    mockMissionUpdateRepository.findByPublicId.mockResolvedValue(mockUpdate);
    mockMissionUpdateRepository.findPointByContext.mockResolvedValue(mockPoints);

    await expect(
      usecase.execute({ updatePublicId: "update-uuid", points: 99 }, "executor-uuid")
    ).rejects.toThrow("Invalid point value for comments");
  });

  it("should throw UnauthorizedMissionEditError if executor is not the report owner", async () => {
    const usecase = new ScoreMissionUpdateUseCase(
      mockMissionUpdateRepository,
      mockMissionRepository,
      mockReportRepository,
      mockUserRepository,
      mockUserExperienceRepository
    );

    const mockUpdate = MissionUpdate.restore({
      updateId: 200,
      publicId: "update-uuid",
      missionId: 100,
      userId: 7,
      comment: "Found tracks!",
      photoUrl: null,
      status: "PENDING",
      createdAt: new Date(),
      pointValue: null
    });

    const mockPoints = [
      PointValue.create({ points: 10, label: "Básico" })
    ];

    const mockMission = Mission.create({
      reportId: 10,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Search",
      description: "Help"
    });

    const mockExecutor = User.reconstruct(
      5,
      "executor-uuid",
      "owner@email.com",
      "owner",
      "$2b$10$abcdefghijklmnopqrstuv",
      true,
      new Date(),
      null,
      null,
      null
    );

    const mockReport = Report.restore({
      idReport: 10,
      publicId: "report-uuid",
      userId: 999, // report owner DOES NOT match mockExecutor (5)
      userPublicId: "other-uuid",
      type: ReportType.LOST,
      currentStatus: "ACTIVE" as any,
      description: null,
      location: Location.create({ address: "Address", latitude: -34.6037, longitude: -58.3816 }),
      details: {} as any,
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: null
    });

    mockMissionUpdateRepository.findByPublicId.mockResolvedValue(mockUpdate);
    mockMissionUpdateRepository.findPointByContext.mockResolvedValue(mockPoints);
    mockMissionRepository.findById.mockResolvedValue(mockMission);
    mockUserRepository.findByPublicId.mockResolvedValue(mockExecutor);
    mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

    await expect(
      usecase.execute({ updatePublicId: "update-uuid", points: 10 }, "executor-uuid")
    ).rejects.toThrow(UnauthorizedMissionEditError);
  });
});
