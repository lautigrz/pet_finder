import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { GetCommentPointValuesController } from "../mission/get-comment-point-values.controller";
import { GetCommentPointValuesUseCase } from "@application/usecase/mission-usecase/get-comment-point-values.usecase";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const buildReq = (): Partial<Request> => ({});

describe("GetCommentPointValuesController", () => {
  let useCase: GetCommentPointValuesUseCase;
  let controller: GetCommentPointValuesController;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as GetCommentPointValuesUseCase;
    controller = new GetCommentPointValuesController(useCase);
  });

  it("debe retornar 200 con la lista de valores de puntos configurados", async () => {
    const mockPointValues = [
      { points: 10, label: "Básico" },
      { points: 25, label: "Bueno" },
    ];
    vi.mocked(useCase.execute).mockResolvedValue(mockPointValues);

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPointValues);
    expect(useCase.execute).toHaveBeenCalled();
  });

  it("debe propagar errores arrojados por el caso de uso", async () => {
    const error = new Error("Database error");
    vi.mocked(useCase.execute).mockRejectedValue(error);

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
