import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetReportUseCase } from "../get-report-usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { MappingError } from "@application/errors/errors";
import { User } from "@domain/entities/User";
import { IUserRepository } from "@domain/repositories/IUserRepository";

const validLocation = Location.create({
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
});

const fakeLostReport = Report.restore({
  idReport: 1,
  publicId: "report-lost-uuid",
  userId: 5,
  userPublicId: "user-pub-id",
  type: ReportType.LOST,
  currentStatus: ReportStatus.ACTIVE,
  description: null,
  details: LostReportDetails.create({ petId: 10 }),
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
  createdAt: new Date("2024-05-01"),
  updatedAt: null,
});

const fakeSightingReport = Report.restore({
  idReport: 2,
  publicId: "report-sighting-uuid",
  userId: 5,
  userPublicId: "user-pub-id",
  type: ReportType.SIGHTING,
  currentStatus: ReportStatus.ACTIVE,
  description: null,
  details: SightingReportDetails.create({
    animalType: AnimalType.DOG,
    hasIdCollar: false,
    color: "black",
    isInTransit: false,
    images: [],
  }),
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
  createdAt: new Date("2024-05-01"),
  updatedAt: null,
});

const fakePet = Pet.restore({
  idPet: 10,
  publicId: "pet-pub-uuid",
  userId: 5,
  name: "Firulais",
  animalType: AnimalType.DOG,
  genderType: GenderType.MALE,
  sizeType: SizeType.MEDIUM,
  color: "brown",
  hasIdCollar: true,
  breed: "Labrador",
  petImage: [],
  createdAt: new Date(),
  isVaccinated: false
});

const fakeUser = User.reconstruct(
  5,
  "user-pub-id",
  "test@example.com",
  "testuser",
  "$2b$10$Somethinghashedhere",
  true,
  new Date(),
  "Test",
  "User",
  "http://example.com/photo.jpg"
);

describe("GetReportUseCase", () => {
  let reportRepository: ReportRepository;
  let userRepository: IUserRepository;
  let useCase: GetReportUseCase;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findDetailByPublicId: vi.fn(),
      findByUserPublicId: vi.fn(),
      findIdsByQuery: vi.fn(),
      findByIds: vi.fn(),
      update: vi.fn(),
      updateFields: vi.fn(),
      findImagesByReportId: vi.fn().mockResolvedValue([]),
    } as unknown as ReportRepository;

    userRepository = {
      findById: vi.fn().mockResolvedValue(fakeUser),
    } as unknown as IUserRepository;

    useCase = new GetReportUseCase(reportRepository, userRepository);
  });

  describe("reporte LOST", () => {
    it("retorna el output del reporte con datos de la mascota", async () => {
      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue({
        report: fakeLostReport,
        pet: fakePet,
      });

      const result = await useCase.execute("report-lost-uuid");

      expect(result.type).toBe(ReportType.LOST);
      expect(reportRepository.findDetailByPublicId).toHaveBeenCalledWith("report-lost-uuid");
      expect(result.details).toMatchObject({
        name: "Firulais",
        breed: "Labrador",
      });
    });

    it("lanza MappingError si la mascota del reporte no existe", async () => {
      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue({
        report: fakeLostReport,
        pet: undefined,
      });

      await expect(useCase.execute("report-lost-uuid")).rejects.toThrow(
        MappingError
      );
    });
  });

  describe("reporte SIGHTING", () => {
    it("retorna el output del reporte sin buscar mascota", async () => {
      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue({
        report: fakeSightingReport,
      });

      const result = await useCase.execute("report-sighting-uuid");

      expect(result.type).toBe(ReportType.SIGHTING);
      expect(result.details).toMatchObject({
        animalType: AnimalType.DOG,
        color: "black",
      });
    });
  });

  describe("reporte no encontrado", () => {
    it("lanza ReportNotFoundError si el reporte no existe", async () => {
      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(null);

      await expect(useCase.execute("non-existent-uuid")).rejects.toThrow(
        ReportNotFoundError
      );
    });
  });

  describe("usuario no encontrado", () => {
    it("lanza Error si el usuario asociado al reporte no existe", async () => {
      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue({
        report: fakeLostReport,
        pet: fakePet,
      });
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute("report-lost-uuid")).rejects.toThrow(
        "User not found"
      );
    });
  });
});
