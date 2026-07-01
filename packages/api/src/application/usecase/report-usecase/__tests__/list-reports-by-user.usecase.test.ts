import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListReportsByUserUseCase } from "@application/usecase/report-usecase/list-reports-by-user.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";

const USER_PUBLIC_ID = "user-pub-id";

const validLocation = {
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
};

function buildSightingReport(publicId: string, status: ReportStatus): Report {
  return Report.restore({
    idReport: 1,
    publicId,
    userId: 5,
    userPublicId: USER_PUBLIC_ID,
    type: ReportType.SIGHTING,
    currentStatus: status,
    description: ReportDescription.create(`Avistamiento ${publicId}`),
    details: new SightingReportDetails(
      null,
      AnimalType.DOG,
      GenderType.MALE,
      SizeType.MEDIUM,
      null,
      false,
      "brown",
      false,
      [SightingImage.create({ cloudinaryId: `img-${publicId}`, photoUrl: `https://fake.com/${publicId}.jpg` })],
    ),
    location: Location.create(validLocation),
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
}

describe("ListReportsByUserUseCase", () => {
  let reportRepository: ReportRepository;
  let petRepository: PetRepository;
  let useCase: ListReportsByUserUseCase;

  beforeEach(() => {
    reportRepository = {
      findByUserPublicId: vi.fn().mockResolvedValue([]),
      findImagesByReportId: vi.fn().mockResolvedValue([]),
    } as unknown as ReportRepository;

    petRepository = {
      findById: vi.fn(),
    } as unknown as PetRepository;

    useCase = new ListReportsByUserUseCase(reportRepository, petRepository);
  });

  it("busca los reportes por el publicId del usuario", async () => {
    await useCase.execute(USER_PUBLIC_ID);

    expect(reportRepository.findByUserPublicId).toHaveBeenCalledWith(USER_PUBLIC_ID);
  });

  it("oculta los reportes CLOSED (suspendidos) y devuelve ACTIVE y RESOLVED", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([
      buildSightingReport("activo", ReportStatus.ACTIVE),
      buildSightingReport("resuelto", ReportStatus.RESOLVED),
      buildSightingReport("suspendido", ReportStatus.CLOSED),
    ]);

    const result = await useCase.execute(USER_PUBLIC_ID);

    expect(result).toHaveLength(2);
    const publicIds = result.map((r) => r.publicId);
    expect(publicIds).toEqual(["activo", "resuelto"]);
    expect(publicIds).not.toContain("suspendido");
  });

  it("devuelve una lista vacía si el usuario no tiene reportes visibles", async () => {
    vi.mocked(reportRepository.findByUserPublicId).mockResolvedValue([
      buildSightingReport("suspendido", ReportStatus.CLOSED),
    ]);

    const result = await useCase.execute(USER_PUBLIC_ID);

    expect(result).toHaveLength(0);
  });
});
