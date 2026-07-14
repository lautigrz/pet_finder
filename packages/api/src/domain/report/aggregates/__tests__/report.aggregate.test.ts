import { describe, it, expect } from "vitest";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { InvalidStatusTransitionError } from "@domain/errors/InvalidStatusTransitionError";
import { InvalidReportDetailsError } from "@domain/errors/InvalidReportDetailsError";
import { InvalidFieldError } from "@domain/errors/InvalidFieldError";
import { SightingImage } from "@domain/report/value-objects/sighting.images";

const validLocation = Location.create({
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
});

const lostDetails = LostReportDetails.create({ petId: 10 });
const sightingDetails = SightingReportDetails.create({
  animalType: AnimalType.DOG,
  hasIdCollar: true,
  color: "brown",
  isInTransit: false,
  images: [SightingImage.create({ cloudinaryId: "fake-id", photoUrl: "https://fake.com/img.jpg" })]
});

const baseLostParams = {
  userId: 1,
  userPublicId: "user-pub-id",
  type: ReportType.LOST as typeof ReportType.LOST,
  description: ReportDescription.create("Mi perro se perdió cerca del parque"),
  details: lostDetails,
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
};

const baseSightingParams = {
  userId: 2,
  userPublicId: "user-pub-id-2",
  type: ReportType.SIGHTING as typeof ReportType.SIGHTING,
  description: null,
  details: sightingDetails,
  location: validLocation,
  occurredAt: new Date("2024-05-01"),
};

describe("Report.create", () => {
  it("crea un reporte LOST con estado ACTIVE y publicId generado", () => {

    const report = Report.create(baseLostParams);


    expect(report.idReport).toBeNull();
    expect(report.publicId).toHaveLength(36);
    expect(report.status).toBe(ReportStatus.ACTIVE);
    expect(report.reportType).toBe(ReportType.LOST);
    expect(report.userId).toBe(1);
    expect(report.userPublicId).toBe("user-pub-id");
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.updatedAt).toBeNull();
  });

  it("crea un reporte SIGHTING correctamente", () => {

    const report = Report.create(baseSightingParams);

    expect(report.reportType).toBe(ReportType.SIGHTING);
    expect(report.description).toBeNull();
  });

  it("lanza InvalidReportDetailsError si se usa SightingReportDetails en reporte LOST", () => {

    const invalidParams = {
      ...baseLostParams,
      details: sightingDetails,
    };


    expect(() => Report.create(invalidParams)).toThrow(InvalidReportDetailsError);
  });

  it("lanza InvalidReportDetailsError si se usa LostReportDetails en reporte SIGHTING", () => {
    const invalidParams = {
      ...baseSightingParams,
      details: lostDetails,
    };

    expect(() => Report.create(invalidParams)).toThrow(InvalidReportDetailsError);
  });
});

describe("Report.restore", () => {
  it("restaura un reporte con todos sus valores", () => {

    const createdAt = new Date("2024-01-01");
    const updatedAt = new Date("2024-06-01");


    const report = Report.restore({
      idReport: 99,
      publicId: "report-uuid-abc",
      userId: 5,
      userPublicId: "user-uuid-xyz",
      type: ReportType.LOST,
      currentStatus: ReportStatus.RESOLVED,
      description: null,
      details: lostDetails,
      location: validLocation,
      occurredAt: new Date("2024-03-10"),
      createdAt,
      updatedAt,
    });


    expect(report.idReport).toBe(99);
    expect(report.publicId).toBe("report-uuid-abc");
    expect(report.status).toBe(ReportStatus.RESOLVED);
    expect(report.createdAt).toBe(createdAt);
    expect(report.updatedAt).toBe(updatedAt);
  });
});

describe("Report.resolve", () => {
  it("transiciona de ACTIVE a RESOLVED", () => {

    const report = Report.create(baseLostParams);
    expect(report.status).toBe(ReportStatus.ACTIVE);


    report.resolve(true);


    expect(report.status).toBe(ReportStatus.RESOLVED);
    expect(report.updatedAt).toBeInstanceOf(Date);
  });

  it("marca resolved=true y setea resolvedAt cuando el dueño indica reencuentro", () => {
    const report = Report.create(baseLostParams);
    report.resolve(true);
    expect(report.resolved).toBe(true);
    expect(report.resolvedAt).toBeInstanceOf(Date);
  });

  it("resolver por otro motivo deja resolved=false pero igual setea resolvedAt", () => {
    const report = Report.create(baseLostParams);
    report.resolve(false);
    expect(report.resolved).toBe(false);
    expect(report.resolvedAt).toBeInstanceOf(Date);
  });

  it("lanza InvalidStatusTransitionError al resolver un reporte CLOSED", () => {

    const report = Report.create(baseLostParams);
    report.close();
    expect(() => report.resolve(true)).toThrow(InvalidStatusTransitionError);
  });

  it("usa la fecha de cierre provista como resolvedAt", () => {
    const report = Report.restore({
      idReport: 1,
      publicId: "report-uuid",
      userId: 1,
      userPublicId: "user-uuid",
      type: ReportType.LOST,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: lostDetails,
      location: validLocation,
      occurredAt: new Date("2024-03-10"),
      createdAt: new Date("2024-03-10"),
      updatedAt: null,
    });

    const closeDate = new Date("2024-03-15");
    report.resolve(true, closeDate);

    expect(report.resolvedAt).toBe(closeDate);
  });

  it("lanza InvalidFieldError si la fecha de cierre es futura", () => {
    const report = Report.create(baseLostParams);
    const future = new Date();
    future.setDate(future.getDate() + 2);

    expect(() => report.resolve(true, future)).toThrow(InvalidFieldError);
  });

  it("lanza InvalidFieldError si la fecha de cierre es anterior a la creación del reporte", () => {
    const report = Report.restore({
      idReport: 1,
      publicId: "report-uuid",
      userId: 1,
      userPublicId: "user-uuid",
      type: ReportType.LOST,
      currentStatus: ReportStatus.ACTIVE,
      description: null,
      details: lostDetails,
      location: validLocation,
      occurredAt: new Date("2024-03-10"),
      createdAt: new Date("2024-03-10"),
      updatedAt: null,
    });

    expect(() => report.resolve(true, new Date("2024-03-05"))).toThrow(InvalidFieldError);
  });

  it("permite cerrar un reporte recién creado con la fecha de hoy (mismo día)", () => {
    const report = Report.create(baseLostParams);

    expect(() => report.resolve(true, new Date())).not.toThrow();
  });
});

describe("Report.close", () => {
  it("transiciona de ACTIVE a CLOSED", () => {

    const report = Report.create(baseLostParams);


    report.close();


    expect(report.status).toBe(ReportStatus.CLOSED);
    expect(report.updatedAt).toBeInstanceOf(Date);
  });

  it("transiciona de RESOLVED a CLOSED", () => {

    const report = Report.create(baseLostParams);
    report.resolve(true);


    report.close();


    expect(report.status).toBe(ReportStatus.CLOSED);
  });

  it("lanza InvalidStatusTransitionError al cerrar un reporte ya CLOSED", () => {

    const report = Report.create(baseLostParams);
    report.close();

    expect(() => report.close()).toThrow(InvalidStatusTransitionError);
  });
});

describe("Report.changeDescription", () => {
  it("actualiza la descripción del reporte", () => {

    const report = Report.create(baseLostParams);
    const newDescription = ReportDescription.create("Nueva descripción actualizada");


    report.changeDescription(newDescription);

    expect(report.description?.value).toBe("Nueva descripción actualizada");
  });
});
