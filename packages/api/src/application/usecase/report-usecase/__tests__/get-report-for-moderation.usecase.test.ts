import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetReportForModerationUseCase } from "../get-report-for-moderation.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { User } from "@domain/entities/User";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { PetImage } from "@domain/pet/value-objects/image.vo";

const location = Location.create({ address: "Calle 1", latitude: -34.6, longitude: -58.4 });

function closedLostReport(): Report {
  return Report.restore({
    idReport: 1, publicId: "report-uuid", userId: 5, userPublicId: "user-pub-id",
    type: ReportType.LOST, currentStatus: ReportStatus.CLOSED, description: null,
    details: LostReportDetails.create({ petId: 10 }), location,
    occurredAt: new Date("2024-05-01"), createdAt: new Date("2024-05-01"), updatedAt: null,
    closedByModeration: true,
  });
}

const fakePet = Pet.restore({
  idPet: 10, publicId: "pet-uuid", userId: 5, name: "Firulais", animalType: AnimalType.DOG,
  genderType: GenderType.MALE, sizeType: SizeType.MEDIUM, color: "brown", hasIdCollar: true,
  breed: "Labrador", petImage: [PetImage.create({ cloudinaryId: "id", photoUrl: "https://x/img.jpg" })],
  createdAt: new Date(), isVaccinated: false,
});

function suspendedUser(): User {
  return User.reconstruct(5, "user-pub-id", "test@example.com", "testuser", "$2b$10$hash", true, new Date(), null, null, null, true);
}

describe("GetReportForModerationUseCase", () => {
  let reportRepository: ReportRepository;
  let userRepository: IUserRepository;
  let useCase: GetReportForModerationUseCase;

  beforeEach(() => {
    reportRepository = {
      findDetailByPublicId: vi.fn(),
      findImagesByReportId: vi.fn().mockResolvedValue([]),
    } as unknown as ReportRepository;
    userRepository = { findById: vi.fn().mockResolvedValue(suspendedUser()) } as unknown as IUserRepository;
    useCase = new GetReportForModerationUseCase(reportRepository, userRepository);
  });

  it("devuelve un reporte CLOSED de un usuario suspendido (a diferencia del endpoint público)", async () => {
    vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue({ report: closedLostReport(), pet: fakePet });

    const output = await useCase.execute("report-uuid");

    expect(output.publicId).toBe("report-uuid");
  });

  it("lanza ReportNotFoundError si el reporte no existe", async () => {
    vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(null);

    await expect(useCase.execute("x")).rejects.toThrow(ReportNotFoundError);
  });
});
