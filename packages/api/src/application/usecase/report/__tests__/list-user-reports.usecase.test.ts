import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListUserReportsUseCase } from "@application/usecase/report/list-user-reports.usecase";
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

const USER_PUBLIC_ID = "user-pub-id";

const validLocation = {
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
};

function buildSightingReport(i: number): Report {
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
    location: Location.create(validLocation),
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
  petImage: [],
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
      findByUserPublicId: vi.fn().mockResolvedValue({
        items: [buildSightingReport(1), buildSightingReport(2)],
        total: 5,
      }),
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

  it("pasa el id público del usuario y la paginación al repositorio", async () => {
    await useCase.execute(USER_PUBLIC_ID, { page: 2, limit: 10 });

    expect(reportRepository.findByUserPublicId).toHaveBeenCalledWith(USER_PUBLIC_ID, {
      page: 2,
      limit: 10,
    });
  });

  it("devuelve los reportes mapeados con la metadata de paginación", async () => {
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
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue({
      items: [buildLostReport(1, 10)],
      total: 1,
    });

    const result = await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 });

    expect(petRepository.findById).toHaveBeenCalledWith(10);
    expect(result.data[0]!.details).toMatchObject({ name: "Firulais" });
  });

  it("lanza PetNotFoundError si la mascota de un reporte LOST no existe", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue({
      items: [buildLostReport(1, 99)],
      total: 1,
    });
    vi.mocked(petRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 })).rejects.toThrow(
      PetNotFoundError,
    );
  });

  it("calcula totalPages en 0 cuando no hay reportes", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await useCase.execute(USER_PUBLIC_ID, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
