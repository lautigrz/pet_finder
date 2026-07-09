import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { GetJoinedMissionsController } from "../mission/get-joined-missions.controller";
import { GetJoinedMissionsUseCase } from "@application/usecase/mission-usecase/get-joined-missions.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const buildReq = (
  opts: { withAuth?: boolean } = {}
): Partial<Request> => ({
  auth: opts.withAuth !== false
    ? { sub: "user-public-id", email: "test@mail.com", isVerified: true }
    : undefined,
});

describe("GetJoinedMissionsController", () => {
  let useCase: GetJoinedMissionsUseCase;
  let controller: GetJoinedMissionsController;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as GetJoinedMissionsUseCase;
    controller = new GetJoinedMissionsController(useCase);
  });

  it("debe retornar 200 con la lista de misiones unidas del usuario", async () => {
    const mockMissions = [
      {
        publicId: "mission-uuid",
        status: "IN_PROGRESS",
        createdAt: new Date(),
        searchArea: { latitude: -34.6037, longitude: -58.3816, radius: 300 },
        report: {
          publicId: "report-uuid",
          location: { address: "Address", latitude: -34.6037, longitude: -58.3816 },
          photoUrl: "https://photo.com/1.jpg",
          title: "Firulais",
          status: "ACTIVE"
        }
      }
    ];

    vi.mocked(useCase.execute).mockResolvedValue(mockMissions as any);

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockMissions);
    expect(useCase.execute).toHaveBeenCalledWith("user-public-id");
  });

  it("debe retornar 404 si el usuario no es encontrado", async () => {
    vi.mocked(useCase.execute).mockRejectedValue(new UserNotFoundError());

    const req = buildReq();
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("debe retornar 404 si no se proporciona información de autenticación", async () => {
    const req = buildReq({ withAuth: false });
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
