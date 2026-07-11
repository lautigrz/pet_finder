import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { ScoreMissionUpdateController } from "../mission/score-mission-update.controller";
import { ScoreMissionUpdateUseCase } from "@application/usecase/mission-usecase/score-mission-update.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const buildReq = (opts: {
  withAuth?: boolean;
  publicId?: string;
  points?: number;
} = {}): Partial<Request> => ({
  auth: opts.withAuth !== false
    ? { sub: "executor-uuid", email: "executor@mail.com", isVerified: true }
    : undefined,
  params: {
    publicId: opts.publicId ?? "update-uuid",
  },
  validated: {
    body: {
      points: opts.points ?? 25,
    },
  } as any,
});

describe("ScoreMissionUpdateController", () => {
  let useCase: ScoreMissionUpdateUseCase;
  let controller: ScoreMissionUpdateController;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as ScoreMissionUpdateUseCase;
    controller = new ScoreMissionUpdateController(useCase);
  });

  it("debe retornar 200 con éxito si la puntuación se realiza correctamente", async () => {
    vi.mocked(useCase.execute).mockResolvedValue(undefined);

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Comment scored successfully",
    });
    expect(useCase.execute).toHaveBeenCalledWith(
      {
        updatePublicId: "update-uuid",
        points: 25,
      },
      "executor-uuid"
    );
  });

  it("debe retornar 404 (UserNotFoundError) si no está autenticado", async () => {
    const req = buildReq({ withAuth: false });
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it("debe propagar errores arrojados por el caso de uso", async () => {
    const error = new Error("Invalid points configuration");
    vi.mocked(useCase.execute).mockRejectedValue(error);

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
