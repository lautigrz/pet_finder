import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetJoinedMissionsUseCase } from "../get-joined-missions.usecase";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { User } from "@domain/entities/User";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

describe("Pruebas Unitarias de GetJoinedMissionsUseCase", () => {
  let mockMissionRepository: any;
  let mockReportRepository: any;
  let mockUserRepository: any;
  let useCase: GetJoinedMissionsUseCase;

  beforeEach(() => {
    mockMissionRepository = {
      findByVolunteerId: vi.fn(),
      update: vi.fn()
    };

    mockReportRepository = {
      findDetailsByIds: vi.fn()
    };

    mockUserRepository = {
      findByPublicId: vi.fn()
    };

    useCase = new GetJoinedMissionsUseCase(
      mockMissionRepository,
      mockReportRepository,
      mockUserRepository
    );
  });

  it("debe lanzar UserNotFoundError si el ID público del usuario no existe", async () => {
    mockUserRepository.findByPublicId.mockResolvedValue(null);

    await expect(useCase.execute("non-existent-uuid")).rejects.toThrow(
      UserNotFoundError
    );
  });

  it("debe retornar una lista vacía si el usuario no tiene misiones unidas", async () => {
    const mockUser = User.reconstruct(
      5,
      "user-uuid",
      "email@email.com",
      "username",
      "$2b$10$abcdefghijklmnopqrstuv",
      true,
      new Date(),
      null,
      null,
      null
    );
    mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
    mockMissionRepository.findByVolunteerId.mockResolvedValue([]);

    const result = await useCase.execute("user-uuid");
    expect(result).toEqual([]);
  });

  it("debe retornar las misiones unidas mapeadas y cerrar las misiones expiradas", async () => {
    const mockUser = User.reconstruct(
      5,
      "user-uuid",
      "email@email.com",
      "username",
      "$2b$10$abcdefghijklmnopqrstuv",
      true,
      new Date(),
      null,
      null,
      null
    );

    // Create an expired mission and a regular mission
    const expiredMission = Mission.restore({
      missionId: 1,
      publicId: "expired-mission-uuid",
      reportId: 10,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Expired Mission",
      description: "Desc",
      status: MissionStatus.OPEN,
      volunteerIds: [5],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    const activeMission = Mission.restore({
      missionId: 2,
      publicId: "active-mission-uuid",
      reportId: 20,
      searchArea: SearchArea.create(-34.6037, -58.3816, 300),
      title: "Active Mission",
      description: "Desc",
      status: MissionStatus.IN_PROGRESS,
      volunteerIds: [5],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const mockReport1 = Report.restore({
      idReport: 10,
      publicId: "report-10-uuid",
      userId: 42,
      userPublicId: "owner-uuid",
      type: ReportType.LOST,
      currentStatus: "ACTIVE" as any,
      description: null,
      location: Location.create({ address: "Address 1", latitude: -34.6037, longitude: -58.3816 }),
      details: {} as any,
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: null
    });

    const mockReport2 = Report.restore({
      idReport: 20,
      publicId: "report-20-uuid",
      userId: 42,
      userPublicId: "owner-uuid",
      type: ReportType.LOST,
      currentStatus: "ACTIVE" as any,
      description: null,
      location: Location.create({ address: "Address 2", latitude: -34.6037, longitude: -58.3816 }),
      details: {} as any,
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: null
    });

    mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
    mockMissionRepository.findByVolunteerId.mockResolvedValue([expiredMission, activeMission]);
    mockReportRepository.findDetailsByIds.mockResolvedValue([
      { report: mockReport1, pet: undefined },
      { report: mockReport2, pet: undefined }
    ]);

    const result = await useCase.execute("user-uuid");

    expect(expiredMission.status).toBe(MissionStatus.CLOSED);
    expect(mockMissionRepository.update).toHaveBeenCalledWith(expiredMission);

    expect(result.length).toBe(2);
    expect(result[0]!.publicId).toBe("expired-mission-uuid");
    expect(result[0]!.status).toBe(MissionStatus.CLOSED);
    expect(result[1]!.publicId).toBe("active-mission-uuid");
    expect(result[1]!.status).toBe(MissionStatus.IN_PROGRESS);
  });
});
