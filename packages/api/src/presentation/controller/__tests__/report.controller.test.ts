import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateReportController } from "../report/create-report.controller";
import { GetReportController } from "../report/get-report.controller";
import { ListUserReportsController } from "../report/list-user-reports.controller";
import { GetFilteredReportsController } from "../report/get-filtered-reports.controller";
import { UpdateReportStatusController } from "../report/update-report-status.controller";
import { FollowReportController } from "../report/follow-report.controller";
import { UnfollowReportController } from "../report/unfollow-report.controller";
import { IsFollowingReportController } from "../report/is-following-report.controller";
import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { GetReportUseCase } from "@application/usecase/report-usecase/get-report-usecase";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { GetFilteredReportsUseCase } from "@application/usecase/report-usecase/get-filter-reports.usecase";
import { UpdateStatus } from "@application/usecase/report-usecase/update-status-report";
import { FollowReportUseCase } from "@application/usecase/report-usecase/follow-report.usecase";
import { UnfollowReportUseCase } from "@application/usecase/report-usecase/unfollow-report.usecase";
import { IsFollowingReportUseCase } from "@application/usecase/report-usecase/is-following-report.usecase";
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
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
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
  params?: Record<string, string>,
): Partial<Request> => ({
  body,
  validated: { body, params: params ?? {} },
  params: params ?? {},
  files: [],
  originalUrl: "/api/reports",
  method: "POST",
  auth: {
    sub: "user-public-id",
    email: "test@mail.com",
    isVerified: true,
  },
  is: vi.fn().mockReturnValue(false),
});

const buildAuthenticatedParamReq = (
  publicId: string | undefined,
  sub = "user-public-id",
): Partial<Request> => ({
  params: publicId ? { publicId } : {},
  validated: {
    params: publicId ? { publicId } : {},
    body: {},
  },
  auth: {
    sub,
    email: "test@mail.com",
    isVerified: true,
  },
  originalUrl: publicId
    ? `/api/reports/${publicId}/follow`
    : "/api/reports/follow",
  method: "POST",
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
  details: {
    animalType: AnimalType.DOG,
    hasIdCollar: false,
    isInTransit: false,
    color: "brown",
    images: [{ url: "https://image1.com" }],
  },
  occurredAt: new Date(),
  createdAt: new Date(),
  updatedAt: null,
  featured: false,
};

const fakeListOutput = {
  data: [fakeReportOutput],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("Report Controllers", () => {
  let createReportUseCase: CreateReportUseCase;
  let getReportUseCase: GetReportUseCase;
  let listUserReportsUseCase: ListUserReportsUseCase;
  let filteredReportsUseCase: GetFilteredReportsUseCase;
  let updateStatusUseCase: UpdateStatus;
  let followReportUseCase: FollowReportUseCase;
  let unfollowReportUseCase: UnfollowReportUseCase;
  let isFollowingReportUseCase: IsFollowingReportUseCase;

  let createReportController: CreateReportController;
  let getReportController: GetReportController;
  let listUserReportsController: ListUserReportsController;
  let getFilteredReportsController: GetFilteredReportsController;
  let updateReportStatusController: UpdateReportStatusController;
  let followReportController: FollowReportController;
  let unfollowReportController: UnfollowReportController;
  let isFollowingReportController: IsFollowingReportController;

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

    filteredReportsUseCase = {
      execute: vi.fn().mockResolvedValue([fakeReportOutput]),
    } as unknown as GetFilteredReportsUseCase;

    updateStatusUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateStatus;

    followReportUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as FollowReportUseCase;

    unfollowReportUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UnfollowReportUseCase;

    isFollowingReportUseCase = {
      execute: vi.fn().mockResolvedValue({ isFollowing: true }),
    } as unknown as IsFollowingReportUseCase;

    createReportController = new CreateReportController(createReportUseCase);
    getReportController = new GetReportController(getReportUseCase);
    listUserReportsController = new ListUserReportsController(listUserReportsUseCase);
    getFilteredReportsController = new GetFilteredReportsController(filteredReportsUseCase);
    updateReportStatusController = new UpdateReportStatusController(updateStatusUseCase);
    followReportController = new FollowReportController(followReportUseCase);
    unfollowReportController = new UnfollowReportController(unfollowReportUseCase);
    isFollowingReportController = new IsFollowingReportController(isFollowingReportUseCase);
  });

  // ─── CreateReportController ──────────────────────────────────────────────

  describe("CreateReportController — reporte LOST válido", () => {
    it("retorna 201 cuando el reporte LOST se crea correctamente", async () => {
      const req = buildReq(validLostBody);
      const res = buildRes();

      await invoke(createReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Report created successfully",
        publicId: "test-report-uuid",
      });
      expect(createReportUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("CreateReportController — reporte SIGHTING válido", () => {
    it("retorna 201 cuando el reporte SIGHTING se crea correctamente", async () => {
      const req = buildReq(validSightingBody);
      const res = buildRes();

      await invoke(createReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(createReportUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("CreateReportController — body inválido", () => {
    it("retorna 400 si el type es desconocido", async () => {
      const req = buildReq({ type: "unknown", location: {} });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createReportRequestSchema)(
        req as Request,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("retorna 400 si falta el campo location", async () => {
      const req = buildReq({ ...validLostBody, location: undefined });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createReportRequestSchema)(
        req as Request,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("CreateReportController — errores de dominio (400)", () => {
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

        await invoke(createReportController.handle, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    }
  });

  describe("CreateReportController — PetNotFoundError (404)", () => {
    it("retorna 404 si la mascota del reporte no existe", async () => {
      const petErr = new PetNotFoundError(10);
      vi.mocked(createReportUseCase.execute).mockRejectedValue(petErr);

      const req = buildReq(validLostBody);
      const res = buildRes();

      await invoke(createReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("CreateReportController — error inesperado (500)", () => {
    it("retorna 500 si ocurre un error no controlado", async () => {
      vi.mocked(createReportUseCase.execute).mockRejectedValue(new Error("Unknown DB error"));

      const req = buildReq(validLostBody);
      const res = buildRes();

      await invoke(createReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── GetReportController ─────────────────────────────────────────────────

  describe("GetReportController — reporte encontrado", () => {
    it("retorna 200 con los datos del reporte", async () => {
      vi.mocked(getReportUseCase.execute).mockResolvedValue(fakeReportOutput);

      const req = buildReq({}, { publicId: "report-uuid" });
      const res = buildRes();

      await invoke(getReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeReportOutput);
    });
  });

  describe("GetReportController — reporte no encontrado", () => {
    it("retorna 404 si el reporte no existe", async () => {
      const notFoundErr = new ReportNotFoundError("non-existent-uuid");
      vi.mocked(getReportUseCase.execute).mockRejectedValue(notFoundErr);

      const req = buildReq({}, { publicId: "non-existent-uuid" });
      const res = buildRes();

      await invoke(getReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── ListUserReportsController ────────────────────────────────────────────

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

  describe("ListUserReportsController — query válida", () => {
    it("retorna 200 con la lista paginada del usuario autenticado", async () => {
      const req = buildListReq({ page: 1, limit: 10 });
      const res = buildRes();

      await invoke(listUserReportsController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeListOutput);
      expect(listUserReportsUseCase.execute).toHaveBeenCalledWith(
        "user-public-id",
        { page: 1, limit: 10 },
        expect.anything(),
      );
    });
  });

  describe("ListUserReportsController — query inválida", () => {
    it("retorna 400 si page es menor a 1", async () => {
      const req = { query: { page: "0" } } as unknown as Request;
      const res = buildRes();
      const next = vi.fn();

      validateRequest(listUserReportsSchema)(req, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── GetFilteredReportsController ─────────────────────────────────────────

  describe("GetFilteredReportsController", () => {
    const buildFilterReq = (query: Record<string, string>): Partial<Request> => ({
      validated: { query },
      originalUrl: "/api/reports/filter",
      method: "GET",
    });

    it("retorna 200 con la lista de reportes filtrados", async () => {
      vi.mocked(filteredReportsUseCase.execute).mockResolvedValue([fakeReportOutput]);

      const req = buildFilterReq({ reportType: "LOST" });
      const res = buildRes();

      await invoke(getFilteredReportsController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([fakeReportOutput]);
    });
  });

  // ─── UpdateReportStatusController ─────────────────────────────────────────

  describe("UpdateReportStatusController", () => {
    const buildUpdateStatusReq = (
      publicId: string | undefined,
      status: string,
    ): Partial<Request> => ({
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

      await invoke(updateReportStatusController.handle, req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(204);
      expect(updateStatusUseCase.execute).toHaveBeenCalledWith({
        publicId: "report-uuid",
        status: "RESOLVED",
      });
    });

    it("propaga errores del caso de uso", async () => {
      const req = buildUpdateStatusReq("report-uuid", "RESOLVED");
      const res = buildRes();

      vi.mocked(updateStatusUseCase.execute).mockRejectedValue(new Error("Report not found"));

      await invoke(updateReportStatusController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── FollowReportController ───────────────────────────────────────────────

  describe("FollowReportController", () => {
    it("retorna 204 cuando el usuario sigue un reporte correctamente", async () => {
      const req = buildAuthenticatedParamReq("report-uuid");
      const res = buildRes();

      await invoke(followReportController.handle, req, res);

      expect(followReportUseCase.execute).toHaveBeenCalledWith({
        userPublicId: "user-public-id",
        reportPublicId: "report-uuid",
      });
      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });

    it("lanza UserNotFoundError si no hay usuario autenticado", async () => {
      const req: Partial<Request> = {
        params: { publicId: "report-uuid" },
        auth: undefined,
        originalUrl: "/api/reports/report-uuid/follow",
        method: "POST",
      };

      const res = buildRes();

      // The new controller throws UserNotFoundError (caught by asyncHandler -> 404)
      await invoke(followReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(followReportUseCase.execute).not.toHaveBeenCalled();
    });

    it("retorna 404 si el reporte a seguir no existe", async () => {
      const req = buildAuthenticatedParamReq("missing-report");
      const res = buildRes();

      vi.mocked(followReportUseCase.execute).mockRejectedValue(
        new ReportNotFoundError("missing-report"),
      );

      await invoke(followReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── UnfollowReportController ─────────────────────────────────────────────

  describe("UnfollowReportController", () => {
    it("retorna 204 cuando el usuario deja de seguir un reporte correctamente", async () => {
      const req = buildAuthenticatedParamReq("report-uuid");
      const res = buildRes();

      await invoke(unfollowReportController.handle, req, res);

      expect(unfollowReportUseCase.execute).toHaveBeenCalledWith({
        userPublicId: "user-public-id",
        reportPublicId: "report-uuid",
      });
      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });
  });

  // ─── IsFollowingReportController ──────────────────────────────────────────

  describe("IsFollowingReportController", () => {
    it("retorna 200 con isFollowing true", async () => {
      const req = buildAuthenticatedParamReq("report-uuid");
      const res = buildRes();

      vi.mocked(isFollowingReportUseCase.execute).mockResolvedValue({
        isFollowing: true,
      });

      await invoke(isFollowingReportController.handle, req, res);

      expect(isFollowingReportUseCase.execute).toHaveBeenCalledWith({
        userPublicId: "user-public-id",
        reportPublicId: "report-uuid",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isFollowing: true });
    });

    it("retorna 200 con isFollowing false", async () => {
      const req = buildAuthenticatedParamReq("report-uuid");
      const res = buildRes();

      vi.mocked(isFollowingReportUseCase.execute).mockResolvedValue({
        isFollowing: false,
      });

      await invoke(isFollowingReportController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isFollowing: false });
    });
  });
});