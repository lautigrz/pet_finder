import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateReportController } from "../report.controller";
import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { InvalidCoordinatesError } from "@domain/errors/InvalidCoordinatesError";
import { InvalidLocationError } from "@domain/errors/InvalidLocationError";
import { InvalidReportDescriptionError } from "@domain/errors/InvalidReportDescriptionError";
import { InvalidStatusTransitionError } from "@domain/errors/InvalidStatusTransitionError";
import { InvalidReportDetailsError } from "@domain/errors/InvalidReportDetailsError";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";
import {
  InvalidFieldError,
  InvalidReportTypeError,
  MappingError,
} from "@application/errors/errors";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const buildReq = (
  body: unknown,
  params?: Record<string, string>
): Partial<Request> => ({
  body,
  params: params ?? {},
  originalUrl: "/api/reports",
  method: "POST",
  auth: {
    sub: "user-public-id",
    email: "test@mail.com",
    isVerified: true
  },
  // Express method needed by the controller to detect multipart/form-data
  is: vi.fn().mockReturnValue(false),
});

const validLostBody = {
  type: ReportType.LOST,
  petId: "pet-pub-uuid",
  occurredAt: "2024-05-01T10:00:00.000Z",
  location: {
    address: "Av. Corrientes 1234",
    latitude: -34.603722,
    longitude: -58.381592,
  },
  description: "Mi perro se perdió",
};

const validSightingBody = {
  type: ReportType.SIGHTING,
  userId: 1,
  animalType: AnimalType.DOG,
  hasIdCollar: false,
  color: "brown",
  occurredAt: "2024-05-01T10:00:00.000Z",
  location: {
    address: "Parque Centenario",
    latitude: -34.606,
    longitude: -58.435,
  },
  description: "Vi un perro perdido",
};

const fakeReportOutput = {
  publicId: "report-uuid",
  user: { publicId: "user-uuid" },
  type: ReportType.SIGHTING,
  status: ReportStatus.ACTIVE,
  description: "",
  location: { address: "Parque", latitude: 0, longitude: 0 },
  details: { animalType: AnimalType.DOG, hasIdCollar: false, color: "brown", images: [{ publicId: "image1", photoUrl: "https://image1.com" }] },
  occurredAt: new Date(),
  createdAt: new Date(),
};

describe("CreateReportController", () => {
  let createReportUseCase: CreateReportUseCase;
  let getReportUseCase: GetReportUseCase;
  let controller: CreateReportController;

  beforeEach(() => {
    createReportUseCase = {
      execute: vi.fn().mockResolvedValue({ publicId: "test-report-uuid" }),
    } as unknown as CreateReportUseCase;

    getReportUseCase = {
      execute: vi.fn().mockResolvedValue(fakeReportOutput),
    } as unknown as GetReportUseCase;

    controller = new CreateReportController(createReportUseCase, getReportUseCase);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe("create — reporte LOST válido", () => {
    it("retorna 201 cuando el reporte LOST se crea correctamente", async () => {
      // Given body válido de reporte lost
      const req = buildReq(validLostBody);
      const res = buildRes();

      // When
      await controller.create(req as Request, res as Response);

      // Then devuelve 201
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Report created successfully",
        publicId: "test-report-uuid",
      });
      expect(createReportUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("create — reporte SIGHTING válido", () => {
    it("retorna 201 cuando el reporte SIGHTING se crea correctamente", async () => {
      // Given body válido de avistamiento
      const req = buildReq(validSightingBody);
      const res = buildRes();

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(createReportUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("create — body inválido", () => {
    it("retorna 400 si el type es desconocido", async () => {
      // Given type inválido que no pasa el schema
      const req = buildReq({ type: "unknown", location: {} });
      const res = buildRes();

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createReportUseCase.execute).not.toHaveBeenCalled();
    });

    it("retorna 400 si falta el campo location", async () => {
      const req = buildReq({ ...validLostBody, location: undefined });
      const res = buildRes();

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createReportUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("create — errores de dominio (400)", () => {
    const domainErrors = [
      { name: "InvalidCoordinatesError", error: new InvalidCoordinatesError("bad lat") },
      { name: "InvalidLocationError", error: new InvalidLocationError("too short") },
      { name: "InvalidReportDescriptionError", error: new InvalidReportDescriptionError("empty") },
      { name: "InvalidStatusTransitionError", error: new InvalidStatusTransitionError("active", "active") },
      { name: "InvalidReportDetailsError", error: new InvalidReportDetailsError("lost", "LostReportDetails") },
      { name: "InvalidFieldError", error: new InvalidFieldError("occurredAt", "future") },
      { name: "InvalidReportTypeError", error: new InvalidReportTypeError("bad-type") },
      { name: "MappingError", error: new MappingError("mapping failed") },
    ];

    for (const { name, error } of domainErrors) {
      it(`retorna 400 si el use case lanza ${name}`, async () => {
        // Given use case que lanza error de dominio
        vi.mocked(createReportUseCase.execute).mockRejectedValue(error);

        const req = buildReq(validLostBody);
        const res = buildRes();
        await controller.create(req as Request, res as Response);

        // Then devuelve 400 con el mensaje
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: error.message });
      });
    }
  });

  describe("create — PetNotFoundError (404)", () => {
    it("retorna 404 si la mascota del reporte no existe", async () => {
      // Given mascota no encontrada
      const petErr = new PetNotFoundError(10);
      vi.mocked(createReportUseCase.execute).mockRejectedValue(petErr);

      const req = buildReq(validLostBody);
      const res = buildRes();
      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: petErr.message });
    });
  });

  describe("create — error inesperado (500)", () => {
    it("retorna 500 si ocurre un error no controlado", async () => {
      // Given error inesperado
      vi.mocked(createReportUseCase.execute).mockRejectedValue(
        new Error("Unknown DB error")
      );

      const req = buildReq(validLostBody);
      const res = buildRes();
      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // ─── getByPublicId ────────────────────────────────────────────────────────

  describe("getByPublicId — reporte encontrado", () => {
    it("retorna 200 con los datos del reporte", async () => {
      // Given reporte existente
      vi.mocked(getReportUseCase.execute).mockResolvedValue(fakeReportOutput);

      const req = buildReq({}, { publicId: "report-uuid" });
      const res = buildRes();
      await controller.getByPublicId(req as Request, res as Response);

      // Then devuelve 200 con el output del reporte
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeReportOutput);
    });
  });

  describe("getByPublicId — reporte no encontrado", () => {
    it("retorna 404 si el reporte no existe", async () => {
      // Given reporte inexistente
      const notFoundErr = new ReportNotFoundError("non-existent-uuid");
      vi.mocked(getReportUseCase.execute).mockRejectedValue(notFoundErr);

      const req = buildReq({}, { publicId: "non-existent-uuid" });
      const res = buildRes();
      await controller.getByPublicId(req as Request, res as Response);

      // Then devuelve 404
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: notFoundErr.message });
    });
  });

  describe("getByPublicId — error inesperado", () => {
    it("retorna 500 si ocurre un error no controlado", async () => {
      // Given error inesperado
      vi.mocked(getReportUseCase.execute).mockRejectedValue(
        new Error("DB failure")
      );

      const req = buildReq({}, { publicId: "any-uuid" });
      const res = buildRes();
      await controller.getByPublicId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });
});
