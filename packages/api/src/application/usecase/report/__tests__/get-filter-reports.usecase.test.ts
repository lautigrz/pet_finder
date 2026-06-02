import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetFilteredReportsUseCase } from "../get-filter-reports.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";

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
});

describe("GetFilteredReportsUseCase", () => {
  let reportRepository: ReportRepository;
  let useCase: GetFilteredReportsUseCase;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findByUserPublicId: vi.fn(),
      findIdsByQuery: vi.fn(),
      findByIds: vi.fn(),
    } as unknown as ReportRepository;

    useCase = new GetFilteredReportsUseCase(reportRepository);
  });

  it("debería retornar un array vacío inmediatamente si no se encuentran IDs", async () => {
    // Given
    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue([]);

    // When
    const result = await useCase.execute({
      reportType: ReportType.LOST,
      animalType: AnimalType.DOG,
    });

    // Then
    expect(result).toEqual([]);
    expect(reportRepository.findIdsByQuery).toHaveBeenCalledOnce();
    expect(reportRepository.findByIds).not.toHaveBeenCalled();
  });

  it("debería buscar por IDs y mapear los reportes devueltos por el repositorio", async () => {
    // Given
    const ids = ["report-sighting-uuid", "report-lost-uuid"];
    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(ids);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
      { report: fakeSightingReport },
      { report: fakeLostReport, pet: fakePet },
    ]);

    // When
    const result = await useCase.execute({
      reportType: ReportType.LOST,
    });

    // Then
    expect(result).toHaveLength(2);
    expect(reportRepository.findIdsByQuery).toHaveBeenCalledOnce();
    expect(reportRepository.findByIds).toHaveBeenCalledWith(ids);

    // Mapped elements verify
    expect(result[0]).toMatchObject({
      publicId: "report-sighting-uuid",
      type: ReportType.SIGHTING,
      status: ReportStatus.ACTIVE,
    });
    expect(result[0]!.details).toMatchObject({
      animalType: AnimalType.DOG,
      color: "black",
    });

    expect(result[1]).toMatchObject({
      publicId: "report-lost-uuid",
      type: ReportType.LOST,
      status: ReportStatus.ACTIVE,
    });
    expect(result[1]!.details).toMatchObject({
      name: "Firulais",
      breed: "Labrador",
    });
  });

  it("debería propagar errores si findIdsByQuery falla", async () => {
    // Given
    const error = new Error("DB Error");
    vi.mocked(reportRepository.findIdsByQuery).mockRejectedValue(error);

    // When / Then
    await expect(useCase.execute({})).rejects.toThrow("DB Error");
  });

  it("debería propagar errores si findByIds falla", async () => {
    // Given
    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(["some-id"]);
    vi.mocked(reportRepository.findByIds).mockRejectedValue(new Error("findByIds failed"));

    // When / Then
    await expect(useCase.execute({})).rejects.toThrow("findByIds failed");
  });

  it("deberia filtrar reportes por userId", async () => {
    // Given
    const ids = ["report-lost-uuid"];
    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(ids);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
        { report: fakeLostReport, pet: fakePet },
    ]);

    // When
    const result = await useCase.execute({
        userPublicId: "user-pub-id",
    });

    // Then
    expect(result).toHaveLength(1);
    expect(reportRepository.findIdsByQuery).toHaveBeenCalledWith(
        expect.objectContaining({ userPublicId: "user-pub-id" })
    );
    expect(result[0]).toMatchObject({
        publicId: "report-lost-uuid",
        user: { publicId: "user-pub-id" },
    });
  });

  it("deberia filtrar reportes cerrados por userId", async () => {
      // Given
      const closedReport = Report.restore({
          ...fakeLostReport,
          idReport: 3,
          publicId: "report-closed-uuid",
          userId: 5,
          userPublicId: "user-pub-id",
          type: ReportType.LOST,
          currentStatus: ReportStatus.CLOSED,
          description: null,
          details: LostReportDetails.create({ petId: 10 }),
          location: validLocation,
          occurredAt: new Date("2024-05-01"),
          createdAt: new Date("2024-05-01"),
          updatedAt: null,
      });

      vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(["report-closed-uuid"]);
      vi.mocked(reportRepository.findByIds).mockResolvedValue([
          { report: closedReport, pet: fakePet },
      ]);

      // When
      const result = await useCase.execute({
          status: ReportStatus.CLOSED,
          userPublicId: "user-pub-id",
      });

      // Then
      expect(result).toHaveLength(1);
      expect(reportRepository.findIdsByQuery).toHaveBeenCalledWith(
          expect.objectContaining({
              status: ReportStatus.CLOSED,
              userPublicId: "user-pub-id",
          })
      );
      expect(result[0]).toMatchObject({
          publicId: "report-closed-uuid",
          status: ReportStatus.CLOSED,
          user: { publicId: "user-pub-id" },
      });
  });
});
