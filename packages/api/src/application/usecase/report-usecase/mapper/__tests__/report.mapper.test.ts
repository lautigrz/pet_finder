import { describe, it, expect } from "vitest";
import { ReportOutputMapper } from "../report.mapper";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "../../../../../domain/report/value-objects/sighting-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { MappingError } from "../../../../errors/errors";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";

const validLocation = Location.create({
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
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
  isVaccinated: true,
  breed: "Labrador",
  petImage: [PetImage.create({
    cloudinaryId: "fake-id",
    photoUrl: "https://fake.com/img.jpg",
  })],
  createdAt: new Date("2024-01-01"),
});

const lostReport = Report.restore({
  idReport: 1,
  publicId: "report-lost-uuid",
  userId: 5,
  userPublicId: "user-pub-id",
  type: ReportType.LOST,
  currentStatus: ReportStatus.ACTIVE,
  description: ReportDescription.create("Perdí a mi perro"),
  details: LostReportDetails.create({ petId: 10 }),
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
  createdAt: new Date("2024-05-01"),
  updatedAt: null,
});

const sightingReport = Report.restore({
  idReport: 2,
  publicId: "report-sighting-uuid",
  userId: 5,
  userPublicId: "user-pub-id",
  type: ReportType.SIGHTING,
  currentStatus: ReportStatus.ACTIVE,
  description: null,
  details: SightingReportDetails.create({
    animalType: AnimalType.CAT,
    hasIdCollar: false,
    color: "orange",
    isInTransit: false,
    images: [SightingImage.create({ cloudinaryId: "fake-id", photoUrl: "https://fake.com/img.jpg" })],
  }),
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
  createdAt: new Date("2024-05-01"),
  updatedAt: null,
});

const resolvedReport = Report.restore({
  idReport: 3,
  publicId: "report-resolved-uuid",
  userId: 5,
  userPublicId: "user-pub-id",
  type: ReportType.SIGHTING,
  currentStatus: ReportStatus.RESOLVED,
  description: null,
  details: SightingReportDetails.create({
    animalType: AnimalType.CAT,
    hasIdCollar: false,
    color: "orange",
    isInTransit: false,
    images: [SightingImage.create({ cloudinaryId: "fake-id", photoUrl: "https://fake.com/img.jpg" })],
  }),
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
  createdAt: new Date("2024-05-01"),
  updatedAt: new Date("2024-06-15T12:00:00.000Z"),
});

describe("ReportMapper.toOutput (application)", () => {
  describe("reporte SIGHTING", () => {
    it("mapea correctamente un reporte de avistamiento sin mascota", () => {
      const output = ReportOutputMapper.toOutput(sightingReport);

      expect(output.publicId).toBe("report-sighting-uuid");
      expect(output.type).toBe(ReportType.SIGHTING);
      expect(output.status).toBe(ReportStatus.ACTIVE);
      expect(output.description).toBe("");
      expect(output.location.address).toBe("Av. Corrientes 1234");
      expect(output.location.latitude).toBe(-34.603722);
      expect(output.location.longitude).toBe(-58.381592);
      expect(output.user.publicId).toBe("user-pub-id");
    });

    it("mapea updatedAt desde el reporte", () => {
      const output = ReportOutputMapper.toOutput(resolvedReport);

      expect(output.updatedAt).toEqual(new Date("2024-06-15T12:00:00.000Z"));
    });

    it("mapea los details de SIGHTING con animalType, hasIdCollar y color", () => {
      const output = ReportOutputMapper.toOutput(sightingReport);
      const details = output.details as { animalType: string; hasIdCollar: boolean; color: string };

      expect(details.animalType).toBe(AnimalType.CAT);
      expect(details.hasIdCollar).toBe(false);
      expect(details.color).toBe("orange");
    });
  });

  describe("reporte LOST", () => {
    it("mapea correctamente un reporte LOST con datos de mascota", () => {

      const output = ReportOutputMapper.toOutput(lostReport, fakePet);


      expect(output.type).toBe(ReportType.LOST);
      expect(output.description).toBe("Perdí a mi perro");
      const details = output.details as {
        publicId: string;
        name: string;
        animalType: string;
        breed: string;
      };
      expect(details.publicId).toBe("pet-pub-uuid");
      expect(details.name).toBe("Firulais");
      expect(details.animalType).toBe(AnimalType.DOG);
      expect(details.breed).toBe("Labrador");
    });

    it("mapea la mascota de LOST usando las fotos de la mascota si no hay fotos específicas del reporte", () => {
      const output = ReportOutputMapper.toOutput(lostReport, fakePet);
      const details = output.details as { images: { url: string }[] };
      expect(details.images).toHaveLength(1);
      expect(details.images[0]!.url).toBe("https://fake.com/img.jpg");
    });

    it("mapea la mascota de LOST usando las fotos del reporte si se proveen fotos específicas", () => {
      const specificImages = [
        SightingImage.create({ cloudinaryId: "specific-1", photoUrl: "https://fake.com/specific-1.jpg" })
      ];
      const output = ReportOutputMapper.toOutput(lostReport, fakePet, undefined, specificImages);
      const details = output.details as { images: { url: string }[] };
      expect(details.images).toHaveLength(1);
      expect(details.images[0]!.url).toBe("https://fake.com/specific-1.jpg");
    });

    it("lanza MappingError si no se proporciona mascota en reporte LOST", () => {

      expect(() => ReportOutputMapper.toOutput(lostReport)).toThrow(MappingError);
    });
  });

  describe("ReportMapper.buildDetails", () => {
    it("lanza MappingError si tipo es LOST y no hay pet", () => {
      expect(() => ReportOutputMapper.buildDetails(lostReport, undefined)).toThrow(
        MappingError
      );
    });

    it("retorna detalles correctos para SIGHTING sin pet", () => {
      const details = ReportOutputMapper.buildDetails(sightingReport);
      expect(details).toMatchObject({
        animalType: AnimalType.CAT,
        hasIdCollar: false,
        color: "orange",
      });
    });
  });
});
