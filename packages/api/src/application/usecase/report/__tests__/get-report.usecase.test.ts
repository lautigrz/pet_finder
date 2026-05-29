import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetReportUseCase } from "../get-report-usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/report.aggregate";
import { Pet } from "@domain/pet/aggregates/pet.aggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";

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
  createdAt: new Date(),
});

describe("GetReportUseCase", () => {
  let reportRepository: ReportRepository;
  let petRepository: PetRepository;
  let useCase: GetReportUseCase;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
    } as unknown as ReportRepository;

    petRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      delete: vi.fn(),
    } as unknown as PetRepository;

    useCase = new GetReportUseCase(reportRepository, petRepository);
  });

  describe("reporte LOST", () => {
    it("retorna el output del reporte con datos de la mascota", async () => {
      // Given reporte lost y mascota existentes
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeLostReport);
      vi.mocked(petRepository.findById).mockResolvedValue(fakePet);

      // When se obtiene el reporte
      const result = await useCase.execute("report-lost-uuid");

      // Then incluye datos de la mascota
      expect(result.type).toBe(ReportType.LOST);
      expect(petRepository.findById).toHaveBeenCalledWith(10);
      expect(result.details).toMatchObject({
        name: "Firulais",
        breed: "Labrador",
      });
    });

    it("lanza PetNotFoundError si la mascota del reporte no existe", async () => {
      // Given reporte lost pero mascota eliminada
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeLostReport);
      vi.mocked(petRepository.findById).mockResolvedValue(null);

      // When/Then
      await expect(useCase.execute("report-lost-uuid")).rejects.toThrow(
        PetNotFoundError
      );
    });
  });

  describe("reporte SIGHTING", () => {
    it("retorna el output del reporte sin buscar mascota", async () => {
      // Given reporte de avistamiento
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        fakeSightingReport
      );

      // When
      const result = await useCase.execute("report-sighting-uuid");

      // Then no busca mascota y devuelve datos del avistamiento
      expect(result.type).toBe(ReportType.SIGHTING);
      expect(petRepository.findById).not.toHaveBeenCalled();
      expect(result.details).toMatchObject({
        animalType: AnimalType.DOG,
        color: "black",
      });
    });
  });

  describe("reporte no encontrado", () => {
    it("lanza ReportNotFoundError si el reporte no existe", async () => {
      // Given reporte inexistente
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

      // When/Then
      await expect(useCase.execute("non-existent-uuid")).rejects.toThrow(
        ReportNotFoundError
      );
    });
  });
});
