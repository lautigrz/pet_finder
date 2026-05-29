import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { ReportType } from "@domain/report/types/report.type";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { User } from "@domain/entities/User";
import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";
import { InvalidFieldError } from "@application/errors/errors";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";

const TEST_EMAIL = "test.user@example.com";

const fakeUser = User.reconstruct(
  5,
  "user-pub-id",
  TEST_EMAIL,
  "testuser",
  "$2b$10$" + "x".repeat(53),
  true,
  new Date(),
  "Lautaro",
  "Gerez",
  null
);

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
  createdAt: new Date(),
});

const validLocation = {
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
};

describe("CreateReportUseCase", () => {
  let reportRepository: ReportRepository;
  let userRepository: IUserRepository;
  let petRepository: PetRepository;
  let useCase: CreateReportUseCase;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByPublicId: vi.fn(),
    } as unknown as ReportRepository;

    userRepository = {
      findByPublicId: vi.fn().mockResolvedValue(fakeUser),
    } as unknown as IUserRepository;

    petRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn().mockResolvedValue(fakePet),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      delete: vi.fn(),
    } as unknown as PrismaPetRepository;

    useCase = new CreateReportUseCase(reportRepository, userRepository, petRepository);
  });

  describe("reporte LOST", () => {
    const lostDto = {
      type: ReportType.LOST as typeof ReportType.LOST,
      petId: "pet-public-uuid",
      occurredAt: new Date("2024-05-01"),
      location: validLocation,
      description: "Mi perro se perdió cerca del parque",
    };

    it("crea y guarda un reporte LOST correctamente", async () => {

      await useCase.execute(lostDto, TEST_EMAIL);

      expect(reportRepository.save).toHaveBeenCalledOnce();
    });

    it("busca la mascota por publicId si el tipo es LOST", async () => {
      await useCase.execute(lostDto, TEST_EMAIL);

      expect(petRepository.findByPublicId).toHaveBeenCalledWith("pet-public-uuid");
    });

    it("lanza error si la mascota no existe", async () => {

      vi.mocked(petRepository.findByPublicId).mockResolvedValue(null);


      await expect(useCase.execute(lostDto, TEST_EMAIL)).rejects.toThrow("Pet not found");
    });

    it("lanza error si el usuario no existe", async () => {
      vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);


      await expect(useCase.execute(lostDto, TEST_EMAIL)).rejects.toThrow("User not found");
    });

    it("lanza InvalidFieldError si occurredAt está en el futuro", async () => {

      const futureDto = {
        ...lostDto,
        occurredAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      await expect(useCase.execute(futureDto, TEST_EMAIL)).rejects.toThrow(
        InvalidFieldError
      );
    });
  });

  describe("reporte SIGHTING", () => {
    const sightingDto = {
      type: ReportType.SIGHTING as typeof ReportType.SIGHTING,
      animalType: AnimalType.DOG,
      hasIdCollar: true,
      color: "brown",
      occurredAt: new Date("2024-05-01"),
      location: validLocation,
      description: "Vi un perro suelto en el parque",
    };

    it("crea y guarda un reporte SIGHTING correctamente", async () => {

      await useCase.execute(sightingDto, TEST_EMAIL);

      expect(reportRepository.save).toHaveBeenCalledOnce();
    });

    it("no busca mascota en repositorio para reporte SIGHTING", async () => {
      await useCase.execute(sightingDto, TEST_EMAIL);

      expect(petRepository.findByPublicId).not.toHaveBeenCalled();
    });

    it("lanza InvalidFieldError si occurredAt está en el futuro", async () => {
      const futureDto = {
        ...sightingDto,
        occurredAt: new Date(Date.now() + 86400000),
      };

      await expect(useCase.execute(futureDto, TEST_EMAIL)).rejects.toThrow(
        InvalidFieldError
      );
    });
  });
});
