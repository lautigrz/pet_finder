import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { GetCoverageController } from "../mission/get-coverage.controller";
import { PostCoverageController } from "../mission/post-coverage.controller";
import { GetMissionCoverageUseCase } from "@application/usecase/mission-usecase/get-mission-coverage.usecase";
import { AddMissionCoverageUseCase } from "@application/usecase/mission-usecase/add-mission-coverage.usecase";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe("Coverage Controllers", () => {
  describe("GetCoverageController", () => {
    let useCase: GetMissionCoverageUseCase;
    let controller: GetCoverageController;

    beforeEach(() => {
      useCase = { execute: vi.fn() } as unknown as GetMissionCoverageUseCase;
      controller = new GetCoverageController(useCase);
    });

    it("debe retornar 200 con la cobertura de la misión", async () => {
      const mockResult = {
        cells: ["cell-1", "cell-2"],
        lastSyncTimestamp: new Date("2026-07-10T12:00:00Z"),
      };

      vi.mocked(useCase.execute).mockResolvedValue(mockResult);

      const req: Partial<Request> = {
        params: { publicId: "mission-uuid" },
        query: { since: "2026-07-10T11:00:00Z" },
      };
      const res = buildRes();

      await invoke(controller.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        cells: ["cell-1", "cell-2"],
        lastSyncTimestamp: "2026-07-10T12:00:00.000Z",
      });
      expect(useCase.execute).toHaveBeenCalledWith("mission-uuid", new Date("2026-07-10T11:00:00Z"));
    });

    it("debe retornar 200 omitiendo el parámetro since si no es válido", async () => {
      const mockResult = {
        cells: [],
        lastSyncTimestamp: new Date("2026-07-10T12:00:00Z"),
      };

      vi.mocked(useCase.execute).mockResolvedValue(mockResult);

      const req: Partial<Request> = {
        params: { publicId: "mission-uuid" },
        query: { since: "invalid-date" },
      };
      const res = buildRes();

      await invoke(controller.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(useCase.execute).toHaveBeenCalledWith("mission-uuid", undefined);
    });
  });

  describe("PostCoverageController", () => {
    let useCase: AddMissionCoverageUseCase;
    let controller: PostCoverageController;

    beforeEach(() => {
      useCase = { execute: vi.fn() } as unknown as AddMissionCoverageUseCase;
      controller = new PostCoverageController(useCase);
    });

    it("debe retornar 201 si la cobertura se guarda correctamente", async () => {
      vi.mocked(useCase.execute).mockResolvedValue(undefined);

      const req: Partial<Request> = {
        params: { publicId: "mission-uuid" },
        auth: { sub: "user-uuid", email: "test@mail.com", isVerified: true },
        body: { cells: ["cell-1", "cell-2"] },
      };
      const res = buildRes();

      await invoke(controller.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Coverage saved",
      });
      expect(useCase.execute).toHaveBeenCalledWith("mission-uuid", "user-uuid", ["cell-1", "cell-2"]);
    });

    it("debe retornar 400 si cells no es un arreglo", async () => {
      const req: Partial<Request> = {
        params: { publicId: "mission-uuid" },
        auth: { sub: "user-uuid", email: "test@mail.com", isVerified: true },
        body: { cells: "not-an-array" },
      };
      const res = buildRes();

      await controller.handle(req as Request, res as Response, () => {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "cells must be an array of strings",
      });
      expect(useCase.execute).not.toHaveBeenCalled();
    });
  });
});
