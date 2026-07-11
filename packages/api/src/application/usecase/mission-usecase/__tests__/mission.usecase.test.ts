import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateMissionUseCase } from "../create-mission.usecase";
import { GetMissionsUseCase } from "../get-missions.usecase";
import { GetMissionDetailUseCase } from "../get-mission-detail.usecase";
import { JoinMissionUseCase } from "../join-mission.usecase";
import { LeaveMissionUseCase } from "../leave-mission.usecase";
import { CancelMissionUseCase } from "../cancel-mission.usecase";
import { CreateMissionUpdateUseCase } from "../create-mission-update.usecase";
import { GetMissionUpdatesUseCase } from "../get-mission-updates.usecase";
import { UpdateMissionUseCase } from "../update-mission.usecase";
import { Mission } from "@domain/mission/Mission";
import { MissionUpdate } from "@domain/mission/MissionUpdate";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { User } from "@domain/entities/User";
import { MissionNotFoundError } from "@domain/errors/MissionNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { UnauthorizedMissionEditError } from "@domain/errors/UnauthorizedMissionEditError";


describe("Pruebas Unitarias de Casos de Uso de Misiones", () => {
  let mockMissionRepository: any;
  let mockReportRepository: any;
  let mockUserRepository: any;
  let mockMissionUpdateRepository: any;
  let mockStorageService: any;

  beforeEach(() => {
    mockMissionRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findActive: vi.fn(),
      findByReportId: vi.fn(),
      update: vi.fn()
    };

    mockReportRepository = {
      findByPublicId: vi.fn(),
      findDetailsByIds: vi.fn()
    };

    mockUserRepository = {
      findByPublicId: vi.fn(),
      findByIds: vi.fn()
    };

    mockMissionUpdateRepository = {
      save: vi.fn(),
      findByMissionId: vi.fn(),
      findByUser: vi.fn()
    };

    mockStorageService = {
      upload: vi.fn(),
      delete: vi.fn()
    };
  });

  describe("CreateMissionUseCase", () => {
    it("debe crear una nueva misión si no existe", async () => {
      const usecase = new CreateMissionUseCase(mockMissionRepository, mockReportRepository);

      const mockReport = Report.restore({
        idReport: 1,
        publicId: "report-uuid",
        userId: 42,
        userPublicId: "user-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      mockReportRepository.findByPublicId.mockResolvedValue(mockReport);
      mockMissionRepository.findByReportId.mockResolvedValue(null);
      mockMissionRepository.save.mockResolvedValue(100);

      const result = await usecase.execute({
        reportPublicId: "report-uuid",
        latitude: -34.6037,
        longitude: -58.3816,
        radius: 300,
        title: "Search for Firulais",
        description: "Help us find him"
      });

      expect(result.publicId).toBeDefined();
      expect(mockMissionRepository.save).toHaveBeenCalled();
    });

    it("debe actualizar los detalles si la misión ya existe", async () => {
      const usecase = new CreateMissionUseCase(mockMissionRepository, mockReportRepository);

      const mockReport = Report.restore({
        idReport: 1,
        publicId: "report-uuid",
        userId: 42,
        userPublicId: "user-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      const existingMission = Mission.restore({
        missionId: 100,
        publicId: "existing-mission-uuid",
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 200),
        title: "Old Title",
        description: "Old Desc",
        status: MissionStatus.OPEN,
        volunteerIds: [],
        createdAt: new Date(),
        updatedAt: null
      });

      mockReportRepository.findByPublicId.mockResolvedValue(mockReport);
      mockMissionRepository.findByReportId.mockResolvedValue(existingMission);

      const result = await usecase.execute({
        reportPublicId: "report-uuid",
        latitude: -34.6037,
        longitude: -58.3816,
        radius: 300,
        title: "New Title",
        description: "New Desc"
      });

      expect(result.publicId).toBe("existing-mission-uuid");
      expect(existingMission.title).toBe("New Title");
      expect(existingMission.searchArea.radius).toBe(300);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(existingMission);
    });
  });

  describe("JoinMissionUseCase", () => {
    it("debe permitir a un voluntario unirse a la misión", async () => {
      const joinUsecase = new JoinMissionUseCase(mockMissionRepository, mockUserRepository);

      const mission = Mission.create({
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

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

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);

      await joinUsecase.execute("mission-uuid", "user-uuid");

      expect(mission.volunteerIds).toContain(5);
      expect(mission.status).toBe(MissionStatus.IN_PROGRESS);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(mission);
    });

    it("debe lanzar MissionNotFoundError si la misión no existe", async () => {
      const joinUsecase = new JoinMissionUseCase(mockMissionRepository, mockUserRepository);
      mockMissionRepository.findByPublicId.mockResolvedValue(null);

      await expect(joinUsecase.execute("non-existent-mission", "user-uuid")).rejects.toThrow(
        MissionNotFoundError
      );
    });

    it("debe lanzar UserNotFoundError si el voluntario no existe", async () => {
      const joinUsecase = new JoinMissionUseCase(mockMissionRepository, mockUserRepository);
      const mission = Mission.create({
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(null);

      await expect(joinUsecase.execute("mission-uuid", "non-existent-user")).rejects.toThrow(
        UserNotFoundError
      );
    });
  });

  describe("LeaveMissionUseCase", () => {
    it("debe permitir a un voluntario abandonar la misión", async () => {
      const leaveUsecase = new LeaveMissionUseCase(mockMissionRepository, mockUserRepository);

      const mission = Mission.restore({
        missionId: 100,
        publicId: "mission-uuid",
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help",
        status: MissionStatus.IN_PROGRESS,
        volunteerIds: [5],
        createdAt: new Date(),
        updatedAt: new Date()
      });

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

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);

      await leaveUsecase.execute("mission-uuid", "user-uuid");

      expect(mission.volunteerIds).not.toContain(5);
      expect(mission.status).toBe(MissionStatus.OPEN);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(mission);
    });
  });

  describe("CancelMissionUseCase", () => {
    it("debe cancelar la misión si la solicita el dueño del reporte", async () => {
      const cancelUsecase = new CancelMissionUseCase(mockMissionRepository, mockReportRepository, mockUserRepository);

      const mission = Mission.create({
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

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

      const mockReport = Report.restore({
        idReport: 10,
        publicId: "report-uuid",
        userId: 5,
        userPublicId: "user-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

      await cancelUsecase.execute("mission-uuid", "user-uuid");

      expect(mission.status).toBe(MissionStatus.CLOSED);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(mission);
    });

    it("debe lanzar UnauthorizedMissionEditError si no es solicitada por el dueño del reporte", async () => {
      const cancelUsecase = new CancelMissionUseCase(mockMissionRepository, mockReportRepository, mockUserRepository);

      const mission = Mission.create({
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

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

      const mockReport = Report.restore({
        idReport: 10,
        publicId: "report-uuid",
        userId: 999,
        userPublicId: "owner-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

      await expect(cancelUsecase.execute("mission-uuid", "user-uuid")).rejects.toThrow(
        UnauthorizedMissionEditError
      );
    });
  });

  describe("CreateMissionUpdateUseCase", () => {
    it("debe agregar una actualización/comentario a una misión activa", async () => {
      const usecase = new CreateMissionUpdateUseCase(
        mockMissionUpdateRepository,
        mockMissionRepository,
        mockUserRepository,
        mockStorageService
      );

      const mission = Mission.create({
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

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

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockMissionUpdateRepository.save.mockResolvedValue(200);

      const result = await usecase.execute({
        missionPublicId: "mission-uuid",
        comment: "I think I saw a track over here",
        photoUrl: "http://photo.com/track.jpg"
      }, "user-uuid");

      expect(result.publicId).toBeDefined();
      expect(mockMissionUpdateRepository.save).toHaveBeenCalled();
    });

    it("debe subir la imagen a Cloudinary si se proporciona un buffer", async () => {
      const usecase = new CreateMissionUpdateUseCase(
        mockMissionUpdateRepository,
        mockMissionRepository,
        mockUserRepository,
        mockStorageService
      );

      const mission = Mission.create({
        reportId: 1,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Search",
        description: "Help"
      });

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

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockStorageService.upload.mockResolvedValue({ publicId: "cloudinary-id", url: "https://cloudinary.com/url.jpg" });
      mockMissionUpdateRepository.save.mockResolvedValue(200);

      const imageBuffer = Buffer.from("fake-image");
      const result = await usecase.execute({
        missionPublicId: "mission-uuid",
        comment: "I think I saw a track over here",
        imageBuffer
      }, "user-uuid");

      expect(result.publicId).toBeDefined();
      expect(mockStorageService.upload).toHaveBeenCalledWith(imageBuffer, "mission_updates");
      expect(mockMissionUpdateRepository.save).toHaveBeenCalled();
      
      const savedUpdate = mockMissionUpdateRepository.save.mock.calls[0][0];
      expect(savedUpdate.photoUrl).toBe("https://cloudinary.com/url.jpg");
    });
  });

  describe("GetMissionsUseCase", () => {
    it("debe retornar la lista de misiones activas y cerrar las expiradas", async () => {
      const usecase = new GetMissionsUseCase(mockMissionRepository, mockReportRepository);

      const expiredMission = Mission.restore({
        missionId: 1,
        publicId: "expired-uuid",
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Expired",
        description: "Desc",
        status: MissionStatus.OPEN,
        volunteerIds: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });

      const activeMission = Mission.restore({
        missionId: 2,
        publicId: "active-uuid",
        reportId: 20,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Active",
        description: "Desc",
        status: MissionStatus.OPEN,
        volunteerIds: [],
        createdAt: new Date(),
        updatedAt: null
      });

      const mockReport = Report.restore({
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

      mockMissionRepository.findActive.mockResolvedValue([expiredMission, activeMission]);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

      const result = await usecase.execute();

      expect(expiredMission.status).toBe(MissionStatus.CLOSED);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(expiredMission);

      expect(result.length).toBe(1);
      expect(result[0]!.publicId).toBe("active-uuid");
    });
  });

  describe("GetMissionDetailUseCase", () => {
    it("debe retornar el detalle de la misión incluyendo reporte, mascota y voluntarios", async () => {
      const usecase = new GetMissionDetailUseCase(
        mockMissionRepository,
        mockReportRepository,
        mockUserRepository,
        mockMissionUpdateRepository
      );

      const mission = Mission.restore({
        missionId: 100,
        publicId: "mission-uuid",
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Title",
        description: "Desc",
        status: MissionStatus.IN_PROGRESS,
        volunteerIds: [5],
        createdAt: new Date(),
        updatedAt: null
      });

      const mockReport = Report.restore({
        idReport: 10,
        publicId: "report-uuid",
        userId: 42,
        userPublicId: "owner-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      const mockVolunteers = [
        { user_id: 5, public_id: "volunteer-uuid", username: "volunteer_username", photoUrl: "http://photo.com/vol.jpg" }
      ];

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);
      mockUserRepository.findByIds.mockResolvedValue(mockVolunteers);
      mockMissionUpdateRepository.findByMissionId.mockResolvedValue([]);

      const result = await usecase.execute("mission-uuid");

      expect(result.publicId).toBe("mission-uuid");
      expect(result.volunteers.length).toBe(1);
      expect(result.volunteers[0]!.publicId).toBe("volunteer-uuid");
    });

    it("debe lanzar MissionNotFoundError si la misión no existe", async () => {
      const usecase = new GetMissionDetailUseCase(
        mockMissionRepository,
        mockReportRepository,
        mockUserRepository,
        mockMissionUpdateRepository
      );
      mockMissionRepository.findByPublicId.mockResolvedValue(null);

      await expect(usecase.execute("non-existent")).rejects.toThrow(MissionNotFoundError);
    });
  });

  describe("GetMissionUpdatesUseCase", () => {
    it("debe retornar la lista de comentarios de la misión con sus autores", async () => {
      const usecase = new GetMissionUpdatesUseCase(mockMissionRepository, mockMissionUpdateRepository, mockUserRepository);

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
        updatedAt: null
      });

      const mockUpdate = MissionUpdate.restore({
        updateId: 200,
        publicId: "update-uuid",
        missionId: 100,
        userId: 5,
        comment: "Found tracks!",
        photoUrl: "http://photo.com/img.jpg",
        status: "APPROVED" as any,
        createdAt: new Date(),
        pointValue: null
      });

      const mockUsers = [
        { user_id: 5, public_id: "user-uuid", username: "test_username", photoUrl: "http://photo.com/usr.jpg" }
      ];

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockMissionUpdateRepository.findByMissionId.mockResolvedValue([mockUpdate]);
      mockUserRepository.findByIds.mockResolvedValue(mockUsers);

      const result = await usecase.execute("mission-uuid");

      expect(result.length).toBe(1);
      expect(result[0]!.publicId).toBe("update-uuid");
      expect(result[0]!.comment).toBe("Found tracks!");
      expect(result[0]!.user.username).toBe("test_username");
    });

    it("debe lanzar MissionNotFoundError si la misión no existe", async () => {
      const usecase = new GetMissionUpdatesUseCase(mockMissionRepository, mockMissionUpdateRepository, mockUserRepository);
      mockMissionRepository.findByPublicId.mockResolvedValue(null);

      await expect(usecase.execute("non-existent")).rejects.toThrow(MissionNotFoundError);
    });
  });

  describe("UpdateMissionUseCase", () => {
    it("debe actualizar los detalles de la misión si es solicitada por el dueño del reporte", async () => {
      const usecase = new UpdateMissionUseCase(mockMissionRepository, mockReportRepository, mockUserRepository);

      const mission = Mission.create({
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Old Title",
        description: "Old Description"
      });

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

      const mockReport = Report.restore({
        idReport: 10,
        publicId: "report-uuid",
        userId: 5,
        userPublicId: "user-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

      await usecase.execute({
        missionPublicId: "mission-uuid",
        userPublicId: "user-uuid",
        title: "New Title",
        description: "New Description",
        latitude: -34.6040,
        longitude: -58.3820,
        radius: 500
      });

      expect(mission.title).toBe("New Title");
      expect(mission.description).toBe("New Description");
      expect(mission.searchArea.latitude).toBe(-34.6040);
      expect(mission.searchArea.longitude).toBe(-58.3820);
      expect(mission.searchArea.radius).toBe(500);
      expect(mockMissionRepository.update).toHaveBeenCalledWith(mission);
    });

    it("debe lanzar UnauthorizedMissionEditError si no es el dueño del reporte", async () => {
      const usecase = new UpdateMissionUseCase(mockMissionRepository, mockReportRepository, mockUserRepository);

      const mission = Mission.create({
        reportId: 10,
        searchArea: SearchArea.create(-34.6037, -58.3816, 300),
        title: "Old Title",
        description: "Old Description"
      });

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

      const mockReport = Report.restore({
        idReport: 10,
        publicId: "report-uuid",
        userId: 999,
        userPublicId: "owner-uuid",
        type: ReportType.LOST,
        currentStatus: "ACTIVE" as any,
        description: null,
        location: Location.create({ address: "Test address", latitude: -34.6037, longitude: -58.3816 }),
        details: {} as any,
        occurredAt: new Date(),
        createdAt: new Date(),
        updatedAt: null
      });

      mockMissionRepository.findByPublicId.mockResolvedValue(mission);
      mockUserRepository.findByPublicId.mockResolvedValue(mockUser);
      mockReportRepository.findDetailsByIds.mockResolvedValue([{ report: mockReport, pet: undefined }]);

      await expect(
        usecase.execute({
          missionPublicId: "mission-uuid",
          userPublicId: "user-uuid",
          title: "New Title",
          description: "New Description",
          latitude: -34.6040,
          longitude: -58.3820,
          radius: 500
        })
      ).rejects.toThrow(UnauthorizedMissionEditError);
    });
  });
});
