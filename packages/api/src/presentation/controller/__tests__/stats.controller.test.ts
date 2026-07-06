import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { GetAdminStatsController } from "../stats/get-admin-stats.controller";
import { GetAdminStatsUseCase } from "@application/usecase/stats-usecase/get-admin-stats.usecase";
import { AdminStatsOutput } from "@application/usecase/stats-usecase/dto/admin-stats.output";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const buildReq = (): Partial<Request> => ({ method: "GET" } as unknown as Partial<Request>);

const fakeStats: AdminStatsOutput = {
  reportsByMonth: [{ month: "2026-07", lost: 3, sighting: 1 }],
  reunionRate: { total: 10, reunited: 4, rate: 40 },
  avgResolutionDays: 5.2,
};

describe("GetAdminStatsController", () => {
  let useCase: GetAdminStatsUseCase;
  let controller: GetAdminStatsController;

  beforeEach(() => {
    useCase = { execute: vi.fn().mockResolvedValue(fakeStats) } as unknown as GetAdminStatsUseCase;
    controller = new GetAdminStatsController(useCase);
  });

  it("retorna 200 con las estadísticas del use case", async () => {
    const res = buildRes();

    await invoke(controller.handle, buildReq(), res);

    expect(useCase.execute).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeStats);
  });
});
