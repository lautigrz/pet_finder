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
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";

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
      update: vi.fn(),
      updateFields: vi.fn(),
      // ← método nuevo: devuelve array vacío por defecto
      findImagesByReportId: vi.fn().mockResolvedValue([]),
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

  it("ordena los reportes del mas cercano al mas lejano cuando llegan lat y lng", async () => {
    const sightingDetails = () =>
      SightingReportDetails.create({
        animalType: AnimalType.DOG,
        hasIdCollar: false,
        color: "black",
        isInTransit: false,
        images: [],
      });

    const cerca = Report.restore({
      idReport: 20,
      publicId: "report-cerca",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: Location.create({ address: "Obelisco", latitude: -34.6037, longitude: -58.3816 }),
      occurredAt: new Date("2024-05-01"),
      createdAt: new Date("2024-05-01"),
      updatedAt: null,
    });

    const lejos = Report.restore({
      idReport: 21,
      publicId: "report-lejos",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: Location.create({ address: "Cordoba", latitude: -31.4201, longitude: -64.1888 }),
      occurredAt: new Date("2024-05-01"),
      createdAt: new Date("2024-05-01"),
      updatedAt: null,
    });

    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(["report-lejos", "report-cerca"]);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
      { report: lejos },
      { report: cerca },
    ]);

    const result = await useCase.execute({ lat: -34.6, lng: -58.38 });

    expect(result.map((r) => r.publicId)).toEqual(["report-cerca", "report-lejos"]);
  });

  it("mantiene el orden del repositorio cuando no llegan lat y lng", async () => {
    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue([
      "report-sighting-uuid",
      "report-lost-uuid",
    ]);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
      { report: fakeSightingReport },
      { report: fakeLostReport, pet: fakePet },
    ]);

    const result = await useCase.execute({});

    expect(result.map((r) => r.publicId)).toEqual([
      "report-sighting-uuid",
      "report-lost-uuid",
    ]);
  });

  it("ordena del mas nuevo al mas antiguo cuando sort es recent", async () => {
    const sightingDetails = () =>
      SightingReportDetails.create({
        animalType: AnimalType.DOG,
        hasIdCollar: false,
        color: "black",
        isInTransit: false,
        images: [],
      });

    const viejo = Report.restore({
      idReport: 30,
      publicId: "report-viejo",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: validLocation,
      occurredAt: new Date("2024-01-01"),
      createdAt: new Date("2024-01-01"),
      updatedAt: null,
    });

    const nuevo = Report.restore({
      idReport: 31,
      publicId: "report-nuevo",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: validLocation,
      occurredAt: new Date("2026-06-01"),
      createdAt: new Date("2026-06-01"),
      updatedAt: null,
    });

    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(["report-viejo", "report-nuevo"]);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
      { report: viejo },
      { report: nuevo },
    ]);

    const result = await useCase.execute({ sort: "recent" });

    expect(result.map((r) => r.publicId)).toEqual(["report-nuevo", "report-viejo"]);
  });

  it("descarta los reportes fuera del radio cuando llega radiusKm", async () => {
    const sightingDetails = () =>
      SightingReportDetails.create({
        animalType: AnimalType.DOG,
        hasIdCollar: false,
        color: "black",
        isInTransit: false,
        images: [],
      });

    const cerca = Report.restore({
      idReport: 40,
      publicId: "report-cerca",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: Location.create({ address: "Obelisco", latitude: -34.6037, longitude: -58.3816 }),
      occurredAt: new Date("2024-05-01"),
      createdAt: new Date("2024-05-01"),
      updatedAt: null,
    });

    const lejos = Report.restore({
      idReport: 41,
      publicId: "report-lejos",
      userId: 5,
      userPublicId: "user-pub-id",
      type: ReportType.SIGHTING,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: sightingDetails(),
      location: Location.create({ address: "Cordoba", latitude: -31.4201, longitude: -64.1888 }),
      occurredAt: new Date("2024-05-01"),
      createdAt: new Date("2024-05-01"),
      updatedAt: null,
    });

    vi.mocked(reportRepository.findIdsByQuery).mockResolvedValue(["report-cerca", "report-lejos"]);
    vi.mocked(reportRepository.findByIds).mockResolvedValue([
      { report: cerca },
      { report: lejos },
    ]);

    const result = await useCase.execute({ lat: -34.6037, lng: -58.3816, radiusKm: 50 });

    expect(result.map((r) => r.publicId)).toEqual(["report-cerca"]);
  });
});
