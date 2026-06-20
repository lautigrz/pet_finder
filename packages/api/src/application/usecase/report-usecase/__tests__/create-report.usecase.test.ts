import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { ReportType } from "@domain/report/types/report.type";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { User } from "@domain/entities/User";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { InvalidFieldError } from "@application/errors/errors";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { StorageService } from "@application/ports/StorageService";
import { PetImage } from "@domain/pet/value-objects/image.vo";

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
  isVaccinated: true,
  breed: "Labrador",
  petImage: [PetImage.create({ cloudinaryId: "fake-id", photoUrl: "https://fake.com/img.jpg" })],
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
  let storageService: StorageService;

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

    storageService = {
      upload: vi.fn().mockResolvedValue({
        publicId: 'image1',
        url: 'https://image1.com',
      }),
    } as unknown as StorageService;


    useCase = new CreateReportUseCase(reportRepository, userRepository, petRepository, storageService);
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

    it("no sube imágenes al storage para un LOST porque ya existen en pet_images", async () => {
      const dtoWithImages = {
        ...lostDto,
        images: [Buffer.from("img1"), Buffer.from("img2")],
      };

      await useCase.execute(dtoWithImages, TEST_EMAIL);

      expect(storageService.upload).not.toHaveBeenCalled();
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });
  });

  describe("reporte SIGHTING", () => {
    const sightingDto = {
      type: ReportType.SIGHTING as typeof ReportType.SIGHTING,
      animalType: AnimalType.DOG,
      hasIdCollar: true,
      color: "brown",
      isInTransit: false,
      occurredAt: new Date("2024-05-01"),
      location: validLocation,
      description: "Vi un perro suelto en el parque",
      images: []
    };

    it("crea y guarda un reporte SIGHTING correctamente", async () => {

      await useCase.execute(sightingDto, TEST_EMAIL);

      expect(reportRepository.save).toHaveBeenCalledOnce();
    });

    it("crea y guarda un reporte SIGHTING con campos opcionales (petName, genderType, sizeType)", async () => {
      const dtoWithOptionals = {
        ...sightingDto,
        petName: "Rex",
        genderType: GenderType.MALE,
        sizeType: SizeType.LARGE,
      };

      await useCase.execute(dtoWithOptionals, TEST_EMAIL);

      expect(reportRepository.save).toHaveBeenCalledOnce();
      const savedReport = vi.mocked(reportRepository.save).mock.calls[0]![0];
      const details = savedReport.details as SightingReportDetails;
      expect(details.petName).toBe("Rex");
      expect(details.genderType).toBe(GenderType.MALE);
      expect(details.sizeType).toBe(SizeType.LARGE);
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

    it("sube imágenes al storage cuando el SIGHTING incluye imágenes", async () => {
      const dtoWithImages = {
        ...sightingDto,
        images: [Buffer.from("img1"), Buffer.from("img2")],
      };

      await useCase.execute(dtoWithImages, TEST_EMAIL);

      expect(storageService.upload).toHaveBeenCalledTimes(2);
      expect(storageService.upload).toHaveBeenCalledWith(expect.any(Buffer), "reports");
    });

    it("no llama al storage si el SIGHTING no tiene imágenes", async () => {
      await useCase.execute({ ...sightingDto, images: [] }, TEST_EMAIL);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it("propaga el error si el storageService falla al subir imágenes", async () => {
      vi.mocked(storageService.upload).mockRejectedValue(new Error("Cloudinary down"));

      const dtoWithImages = {
        ...sightingDto,
        images: [Buffer.from("img")],
      };

      await expect(useCase.execute(dtoWithImages, TEST_EMAIL)).rejects.toThrow("Cloudinary down");
    });
  });

  describe("reporte LOST — casos adicionales", () => {
    it("lanza error si el tipo es LOST pero no se provee petId", async () => {
      const lostDtoWithoutPetId = {
        type: ReportType.LOST as typeof ReportType.LOST,
        occurredAt: new Date("2024-05-01"),
        location: validLocation,
        description: "Se perdió mi perro",

      };


      await expect(
        useCase.execute(lostDtoWithoutPetId as Parameters<typeof useCase.execute>[0], TEST_EMAIL)
      ).rejects.toThrow("Pet id is required for lost report");
    });
  });
});

