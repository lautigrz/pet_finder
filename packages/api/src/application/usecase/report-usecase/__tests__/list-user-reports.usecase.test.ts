import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import { PetImage } from "@domain/pet/value-objects/image.vo";

const USER_PUBLIC_ID = "user-pub-id";

const validLocation = {
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
};

function buildSightingReport(i: number, loc = validLocation): Report {
  return Report.restore({
    idReport: i,
    publicId: `sighting-${i}`,
    userId: 5,
    userPublicId: USER_PUBLIC_ID,
    type: ReportType.SIGHTING,
    currentStatus: ReportStatus.ACTIVE,
    description: ReportDescription.create(`Avistamiento ${i}`),
    details: new SightingReportDetails(
      AnimalType.DOG,
      AnimalType.DOG,
      GenderType.MALE,
      null,
      "" as any,
      false as any,
      false as any,
      false as any,
      false as any,
    ),
    location: Location.create(loc),
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
}

function buildLostReport(i: number, petId: number): Report {
  return Report.restore({
    idReport: i,
    publicId: `lost-${i}`,
    userId: 5,
    userPublicId: USER_PUBLIC_ID,
    type: ReportType.LOST,
    currentStatus: ReportStatus.ACTIVE,
    description: ReportDescription.create(`Perdido ${i}`),
    details: new LostReportDetails(petId),
    location: Location.create(validLocation),
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
}

const fakePet = Pet.restore({
  idPet: 10,
  publicId: "pet-public-uuid",
  userId: 5,
  name: "Firulais",
  animalType: AnimalType.DOG,
  genderType: GenderType.MALE,
  sizeType: SizeType.MEDIUM,
  color: "brown",
  hasIdCollar: true,
  breed: "Labrador",
  petImage: [PetImage.create({
    cloudinaryId: "fake-id",
    photoUrl: "https://fake.com/img.jpg",
  })],
  createdAt: new Date(),
  isVaccinated: false
});

describe("ListUserReportsUseCase", () => {
  let reportRepository: ReportRepository;
  let petRepository: PetRepository;
  let useCase: ListUserReportsUseCase;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findByUserPublicId: vi.fn().mockResolvedValue([buildSightingReport(1), buildSightingReport(2)]),
      findIdsByQuery: vi.fn(),
      findByIds: vi.fn(),
      update: vi.fn(),
      updateFields: vi.fn(),
      findImagesByReportId: vi.fn().mockResolvedValue([]),
    } as unknown as ReportRepository;

    petRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakePet),
      findAllByUserId: vi.fn(),
      delete: vi.fn(),
    } as unknown as PetRepository;

    useCase = new ListUserReportsUseCase(reportRepository, petRepository);
  });

  it("pasa el id del usuario y los filtros al repositorio", async () => {
    await useCase.execute(
      USER_PUBLIC_ID,
      { page: 2, limit: 10 },
      {
        reportType: "LOST",
        createdFrom: "2026-06-01",
        createdTo: "2026-06-10",
        q: "collar rojo",
      },
    );

    expect(reportRepository.findByUserPublicId).toHaveBeenCalledWith(
      USER_PUBLIC_ID,
      {
        reportType: "LOST",
        animalType: undefined,
        createdFrom: "2026-06-01",
        createdTo: "2026-06-10",
        q: "collar rojo",
      },
    );
  });

  it("pasa q como undefined cuando no se proporciona una búsqueda", async () => {
    await useCase.execute(
      USER_PUBLIC_ID,
      { page: 1, limit: 10 },
    );

    expect(reportRepository.findByUserPublicId).toHaveBeenCalledWith(
      USER_PUBLIC_ID,
      {
        reportType: undefined,
        animalType: undefined,
        createdFrom: undefined,
        createdTo: undefined,
        q: undefined,
      },
    );
  });

  it("devuelve los reportes paginados con la metadata", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([
      buildSightingReport(1),
      buildSightingReport(2),
      buildSightingReport(3),
      buildSightingReport(4),
      buildSightingReport(5),
    ]);

    const result = await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("no consulta mascotas para reportes SIGHTING", async () => {
    await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 });

    expect(petRepository.findById).not.toHaveBeenCalled();
  });

  it("carga la mascota para reportes LOST e incluye su detalle", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([buildLostReport(1, 10)]);

    const result = await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 });

    expect(petRepository.findById).toHaveBeenCalledWith(10);
    expect(result.data[0]!.details).toMatchObject({ name: "Firulais" });
  });

  it("lanza PetNotFoundError si la mascota de un reporte LOST no existe", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([buildLostReport(1, 99)]);
    vi.mocked(petRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 })).rejects.toThrow(
      PetNotFoundError,
    );
  });

  it("calcula totalPages en 0 cuando no hay reportes", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([]);

    const result = await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("descarta los reportes fuera del radio", async () => {
    const cerca = buildSightingReport(1, {
      address: "Obelisco",
      latitude: -34.6037,
      longitude: -58.3816,
    });
    const lejos = buildSightingReport(2, {
      address: "Cordoba",
      latitude: -31.4201,
      longitude: -64.1888,
    });
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([cerca, lejos]);

    const result = await useCase.execute(
      USER_PUBLIC_ID,
      { page: 1, limit: 10 },
      { lat: -34.6037, lng: -58.3816, radiusKm: 50 },
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.publicId).toBe("sighting-1");
  });
});
