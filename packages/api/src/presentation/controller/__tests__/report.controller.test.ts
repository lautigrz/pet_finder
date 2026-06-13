import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateReportController } from "../report.controller";
import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { ListUserReportsUseCase } from "@application/usecase/report/list-user-reports.usecase";
import { GetFilteredReportsUseCase } from "@application/usecase/report/get-filter-reports.usecase";
import { UpdateStatus } from "@application/usecase/report/update-status-report";
import { ValidationError } from "../../errors/ValidationError";
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
import { validateRequest } from "../../middleware/validate.request";
import { createReportRequestSchema } from "../../schemas/report/create-report.schema";
import { listUserReportsSchema } from "../../schemas/report/list-user-reports.schema";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  sendStatus: vi.fn().mockReturnThis(),
});

const buildReq = (
  body: unknown,
  params?: Record<string, string>
): Partial<Request> => ({
  body,
  validated: { body, params: params ?? {} },
  params: params ?? {},
  originalUrl: "/api/reports",
  method: "POST",
  auth: {
    sub: "user-public-id",
    email: "test@mail.com",
    isVerified: true
  },
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
  genderType: "male",
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
  user: {
    publicId: "user-uuid",
    username: "testuser",
    photoUrl: "https://photo.example.com/avatar.jpg",
  },
  type: ReportType.SIGHTING,
  status: ReportStatus.ACTIVE,
  description: "",
  location: { address: "Parque", latitude: 0, longitude: 0 },
  details: { animalType: AnimalType.DOG, hasIdCollar: false, isInTransit: false, color: "brown", images: [{ url: "https://image1.com" }] },
  occurredAt: new Date(),
  createdAt: new Date(),
};

const fakeListOutput = {
  data: [fakeReportOutput],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("CreateReportController", () => {
  let createReportUseCase: CreateReportUseCase;
  let getReportUseCase: GetReportUseCase;
  let listUserReportsUseCase: ListUserReportsUseCase;
  let filteresUseCase: GetFilteredReportsUseCase;
  let updateStatusUseCase: UpdateStatus;
  let updateReportUseCase: any;
  let controller: CreateReportController;

  beforeEach(() => {
    createReportUseCase = {
      execute: vi.fn().mockResolvedValue({ publicId: "test-report-uuid" }),
    } as unknown as CreateReportUseCase;

    getReportUseCase = {
      execute: vi.fn().mockResolvedValue(fakeReportOutput),
    } as unknown as GetReportUseCase;

    listUserReportsUseCase = {
      execute: vi.fn().mockResolvedValue(fakeListOutput),
    } as unknown as ListUserReportsUseCase;

    filteresUseCase = {
      execute: vi.fn().mockResolvedValue([fakeReportOutput]),
    } as unknown as GetFilteredReportsUseCase;

    updateStatusUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateStatus;

    updateReportUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any;

    controller = new CreateReportController(
      createReportUseCase,
      getReportUseCase,
      listUserReportsUseCase,
      filteresUseCase,
      updateStatusUseCase,
      updateReportUseCase
    );
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe("create — reporte LOST válido", () => {
    it("retorna 201 cuando el reporte LOST se crea correctamente", async () => {
      const req = buildReq(validLostBody);
      const res = buildRes();

      await invoke(controller.create, req, res);

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
      const req = buildReq(validSightingBody);
      const res = buildRes();

      await invoke(controller.create, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(createReportUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("create — body inválido", () => {
    it("retorna 400 si el type es desconocido", async () => {
      const req = buildReq({ type: "unknown", location: {} });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createReportRequestSchema)(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("retorna 400 si falta el campo location", async () => {
      const req = buildReq({ ...validLostBody, location: undefined });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createReportRequestSchema)(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("create — errores de dominio (400)", () => {
    const domainErrors = [
      { name: "InvalidCoordinatesError", error: new InvalidCoordinatesError("bad lat") },
      { name: "InvalidLocationError", error: new InvalidLocationError() },
      { name: "InvalidReportDescriptionError", error: new InvalidReportDescriptionError("empty") },
      { name: "InvalidStatusTransitionError", error: new InvalidStatusTransitionError("active", "active") },
      { name: "InvalidReportDetailsError", error: new InvalidReportDetailsError("lost", "LostReportDetails") },
      { name: "InvalidFieldError", error: new InvalidFieldError("occurredAt", "future") },
      { name: "InvalidReportTypeError", error: new InvalidReportTypeError("bad-type") },
      { name: "MappingError", error: new MappingError("mapping failed") },
    ];

    for (const { name, error } of domainErrors) {
      it(`retorna 400 si el use case lanza ${name}`, async () => {
        vi.mocked(createReportUseCase.execute).mockRejectedValue(error);

        const req = buildReq(validLostBody);
        const res = buildRes();
        await invoke(controller.create, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    }
  });

  describe("create — PetNotFoundError (404)", () => {
    it("retorna 404 si la mascota del reporte no existe", async () => {
      const petErr = new PetNotFoundError(10);
      vi.mocked(createReportUseCase.execute).mockRejectedValue(petErr);

      const req = buildReq(validLostBody);
      const res = buildRes();
      await invoke(controller.create, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("create — error inesperado (500)", () => {
    it("retorna 500 si ocurre un error no controlado", async () => {
      vi.mocked(createReportUseCase.execute).mockRejectedValue(new Error("Unknown DB error"));

      const req = buildReq(validLostBody);
      const res = buildRes();
      await invoke(controller.create, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getByPublicId ────────────────────────────────────────────────────────

  describe("getByPublicId — reporte encontrado", () => {
    it("retorna 200 con los datos del reporte", async () => {
      vi.mocked(getReportUseCase.execute).mockResolvedValue(fakeReportOutput);

      const req = buildReq({}, { publicId: "report-uuid" });
      const res = buildRes();
      await invoke(controller.getByPublicId, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeReportOutput);
    });
  });

  describe("getByPublicId — reporte no encontrado", () => {
    it("retorna 404 si el reporte no existe", async () => {
      const notFoundErr = new ReportNotFoundError("non-existent-uuid");
      vi.mocked(getReportUseCase.execute).mockRejectedValue(notFoundErr);

      const req = buildReq({}, { publicId: "non-existent-uuid" });
      const res = buildRes();
      await invoke(controller.getByPublicId, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getByPublicId — error inesperado", () => {
    it("retorna 500 si ocurre un error no controlado", async () => {
      vi.mocked(getReportUseCase.execute).mockRejectedValue(new Error("DB failure"));

      const req = buildReq({}, { publicId: "any-uuid" });
      const res = buildRes();
      await invoke(controller.getByPublicId, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  const buildListReq = (query: Record<string, unknown>): Partial<Request> => ({
    validated: { query },
    originalUrl: "/api/reports",
    method: "GET",
    auth: {
      sub: "user-public-id",
      email: "test@mail.com",
      isVerified: true,
    },
  });


  describe("list — query válida", () => {
    it("retorna 200 con la lista paginada del usuario autenticado", async () => {
      const req = buildListReq({ page: 1, limit: 10 });

      const res = buildRes();
      await invoke(controller.list, req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeListOutput);
      expect(listUserReportsUseCase.execute).toHaveBeenCalledWith(
        "user-public-id",
        { page: 1, limit: 10 },
        expect.anything(),
      );
    });

    it("pasa los filtros y la búsqueda al use case", async () => {
      // Given
      const req = buildListReq({
        page: 1,
        limit: 10,
        reportType: "LOST",
        animalType: "DOG",
        radiusKm: 5,
        q: "  collar rojo  ",
      });

      const res = buildRes();

      // When
      await invoke(controller.list, req, res);

      // Then
      expect(listUserReportsUseCase.execute).toHaveBeenCalledWith(
        "user-public-id",
        {
          page: 1,
          limit: 10,
        },
        expect.objectContaining({
          reportType: "LOST",
          animalType: "DOG",
          radiusKm: 5,
          q: "  collar rojo  ",
        }),
      );
    });


    describe("list — query inválida", () => {
      it("retorna 400 si page es menor a 1", async () => {
        const req = { query: { page: "0" } } as unknown as Request;
        const res = buildRes();
        const next = vi.fn();

        validateRequest(listUserReportsSchema)(req, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
        expect(listUserReportsUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe("list — PetNotFoundError (404)", () => {
      it("retorna 404 si un reporte LOST referencia una mascota inexistente", async () => {
        const petErr = new PetNotFoundError(99);
        vi.mocked(listUserReportsUseCase.execute).mockRejectedValue(petErr);

        const req = buildListReq({ page: 1, limit: 10 });
        const res = buildRes();
        await invoke(controller.list, req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });

      it("retorna 500 si ocurre un error no controlado", async () => {
        vi.mocked(listUserReportsUseCase.execute).mockRejectedValue(new Error("DB failure"));

        const req = buildListReq({ page: 1, limit: 10 });
        const res = buildRes();
        await invoke(controller.list, req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    // ─── getFilteres ──────────────────────────────────────────────────────────

    describe("getFilteres", () => {
      const buildFilterReq = (query: Record<string, string>): Partial<Request> => ({
        validated: { query },
        originalUrl: "/api/reports/filter",
        method: "GET",
      });

      it("pasa q al caso de uso de reportes filtrados", async () => {
        // Given
        const req = buildFilterReq({
          q: "perrro marron",
        });

        const res = buildRes();

        // When
        await invoke(controller.getFilteres, req, res);

        // Then
        expect(filteresUseCase.execute).toHaveBeenCalledWith({
          q: "perrro marron",
        });

        expect(res.status).toHaveBeenCalledWith(200);
      });
      it("retorna 200 con la lista de reportes filtrados", async () => {
        vi.mocked(filteresUseCase.execute).mockResolvedValue([fakeReportOutput]);

        const req = buildFilterReq({ reportType: "LOST" });
        const res = buildRes();

        await invoke(controller.getFilteres, req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([fakeReportOutput]);
        expect(filteresUseCase.execute).toHaveBeenCalledWith({ reportType: "LOST" });
      });

      it("retorna 400 si el caso de uso lanza ValidationError", async () => {
        const validationErr = new ValidationError(["ReportType inválido"]);
        vi.mocked(filteresUseCase.execute).mockRejectedValue(validationErr);

        const req = buildFilterReq({ reportType: "INVALID" });
        const res = buildRes();

        await invoke(controller.getFilteres, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("retorna 400 si el caso de uso lanza MappingError", async () => {
        const mappingErr = new MappingError("Error de mapeo");
        vi.mocked(filteresUseCase.execute).mockRejectedValue(mappingErr);

        const req = buildFilterReq({ reportType: "LOST" });
        const res = buildRes();

        await invoke(controller.getFilteres, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("retorna 500 si ocurre un error no controlado", async () => {
        vi.mocked(filteresUseCase.execute).mockRejectedValue(new Error("Unexpected DB fail"));

        const req = buildFilterReq({ reportType: "LOST" });
        const res = buildRes();

        await invoke(controller.getFilteres, req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    // ─── updateStatus ─────────────────────────────────────────────────────────

    describe("updateStatus", () => {
      const buildUpdateStatusReq = (publicId: string | undefined, status: string): Partial<Request> => ({
        validated: {
          params: { publicId },
          body: { status },
        },
        originalUrl: `/api/reports/status/${publicId}`,
        method: "PATCH",
      });

      it("retorna 204 cuando el estado se actualiza con éxito", async () => {
        const req = buildUpdateStatusReq("report-uuid", "RESOLVED");
        const res = buildRes();
        vi.mocked(updateStatusUseCase.execute).mockResolvedValue(undefined);

        await invoke(controller.updateStatus, req, res);

        expect(res.sendStatus).toHaveBeenCalledWith(204);
        expect(updateStatusUseCase.execute).toHaveBeenCalledWith({
          publicId: "report-uuid",
          status: "RESOLVED",
        });
      });

      it("retorna 401 si falta publicId en los parámetros", async () => {
        const req = buildUpdateStatusReq(undefined, "RESOLVED");
        const res = buildRes();

        await invoke(controller.updateStatus, req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        expect(updateStatusUseCase.execute).not.toHaveBeenCalled();
      });

      it("propaga errores del caso de uso", async () => {
        const req = buildUpdateStatusReq("report-uuid", "RESOLVED");
        const res = buildRes();
        vi.mocked(updateStatusUseCase.execute).mockRejectedValue(new Error("Report not found"));

        await invoke(controller.updateStatus, req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
