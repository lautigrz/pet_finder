import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateAppealController } from "../appeal/create-appeal.controller";
import { GetAppealQueueController } from "../appeal/get-appeal-queue.controller";
import { ResolveAppealController } from "../appeal/resolve-appeal.controller";
import { CreateAppealUseCase } from "@application/usecase/appeal-usecase/create-appeal.usecase";
import { GetAppealQueueUseCase } from "@application/usecase/appeal-usecase/get-appeal-queue.usecase";
import { ResolveAppealUseCase } from "@application/usecase/appeal-usecase/resolve-appeal.usecase";
import { CreateAppealOutput } from "@application/usecase/appeal-usecase/create-appeal.output";
import { AlreadyAppealedError } from "@domain/appeal/errors/AlreadyAppealedError";
import { AppealNotFoundError } from "@domain/appeal/errors/AppealNotFoundError";
import { AppealStatus } from "@domain/appeal/types/appeal-status";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { Appeal } from "@domain/appeal/Appeal";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  sendStatus: vi.fn().mockReturnThis(),
});

const buildReq = (validated: unknown): Partial<Request> => ({ validated, method: "POST" } as unknown as Partial<Request>);

describe("CreateAppealController", () => {
  let useCase: CreateAppealUseCase;
  let controller: CreateAppealController;

  beforeEach(() => {
    useCase = { execute: vi.fn().mockResolvedValue(new CreateAppealOutput("appeal-uuid")) } as unknown as CreateAppealUseCase;
    controller = new CreateAppealController(useCase);
  });

  it("retorna 201 con el publicId y llama al use case con token y mensaje", async () => {
    const req = buildReq({ body: { token: "tok", message: "mi defensa" } });
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(useCase.execute).toHaveBeenCalledWith(expect.objectContaining({ token: "tok", message: "mi defensa" }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ publicId: "appeal-uuid" }));
  });

  it("retorna 409 si el caso ya fue apelado", async () => {
    vi.mocked(useCase.execute).mockRejectedValue(new AlreadyAppealedError());
    const res = buildRes();

    await invoke(controller.handle, buildReq({ body: { token: "tok", message: "x" } }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "ALREADY_APPEALED" }));
  });
});

describe("ResolveAppealController", () => {
  let useCase: ResolveAppealUseCase;
  let controller: ResolveAppealController;

  beforeEach(() => {
    useCase = { execute: vi.fn().mockResolvedValue(undefined) } as unknown as ResolveAppealUseCase;
    controller = new ResolveAppealController(useCase);
  });

  it("retorna 200 y resuelve con el publicId y la decisión", async () => {
    const req = buildReq({ params: { publicId: "a-uuid" }, body: { accept: true } });
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(useCase.execute).toHaveBeenCalledWith(expect.objectContaining({ publicId: "a-uuid", accept: true }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("retorna 404 si la apelación no existe", async () => {
    vi.mocked(useCase.execute).mockRejectedValue(new AppealNotFoundError());
    const res = buildRes();

    await invoke(controller.handle, buildReq({ params: { publicId: "x" }, body: { accept: false } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "APPEAL_NOT_FOUND" }));
  });
});

describe("GetAppealQueueController", () => {
  let useCase: GetAppealQueueUseCase;
  let controller: GetAppealQueueController;

  const fakeAppeal = Appeal.restore({
    appealId: 1, publicId: "a-uuid", appellantUserId: 9, targetType: AppealTargetType.POST,
    targetPublicId: "post-uuid", message: "mi defensa", status: AppealStatus.PENDING,
    createdAt: new Date("2026-06-20"), resolvedAt: null,
  });

  beforeEach(() => {
    const queue = [{ appeal: fakeAppeal, appellant: { publicId: "owner-uuid", username: "owner" } }];
    useCase = { execute: vi.fn().mockResolvedValue(queue) } as unknown as GetAppealQueueUseCase;
    controller = new GetAppealQueueController(useCase);
  });

  it("retorna 200 con la cola mapeada al shape de respuesta", async () => {
    const res = buildRes();

    await invoke(controller.handle, buildReq({ query: {} }), res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        publicId: "a-uuid",
        targetType: AppealTargetType.POST,
        message: "mi defensa",
        status: AppealStatus.PENDING,
        appellant: { publicId: "owner-uuid", username: "owner" },
      }),
    ]);
  });

  it("pasa el status del query al use case", async () => {
    const res = buildRes();

    await invoke(controller.handle, buildReq({ query: { status: "ACCEPTED" } }), res);

    expect(useCase.execute).toHaveBeenCalledWith("ACCEPTED");
  });
});
