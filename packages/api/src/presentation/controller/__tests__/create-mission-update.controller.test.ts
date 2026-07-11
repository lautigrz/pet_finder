import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateMissionUpdateController } from "../mission/create-mission-update.controller";
import { CreateMissionUpdateUseCase } from "@application/usecase/mission-usecase/create-mission-update.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe("CreateMissionUpdateController", () => {
  let useCase: CreateMissionUpdateUseCase;
  let controller: CreateMissionUpdateController;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as CreateMissionUpdateUseCase;
    controller = new CreateMissionUpdateController(useCase);
  });

  it("debe crear una actualización de misión correctamente sin archivo adjunto", async () => {
    vi.mocked(useCase.execute).mockResolvedValue({ publicId: "update-uuid" } as any);

    const req: Partial<Request> = {
      auth: { sub: "user-uuid", email: "test@mail.com", isVerified: true },
      validated: {
        body: {
          missionPublicId: "mission-uuid",
          comment: "I saw a track",
          photoUrl: "http://photo.com/img.jpg",
        },
      } as any,
    };
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ publicId: "update-uuid" });
    expect(useCase.execute).toHaveBeenCalledWith(
      {
        missionPublicId: "mission-uuid",
        comment: "I saw a track",
        photoUrl: "http://photo.com/img.jpg",
        imageBuffer: undefined,
      },
      "user-uuid"
    );
  });

  it("debe crear una actualización de misión correctamente con archivo adjunto", async () => {
    vi.mocked(useCase.execute).mockResolvedValue({ publicId: "update-uuid" } as any);

    const fakeFile = {
      buffer: Buffer.from("fake-image-data"),
      fieldname: "photos",
    } as Express.Multer.File;

    const req: Partial<Request> = {
      auth: { sub: "user-uuid", email: "test@mail.com", isVerified: true },
      files: [fakeFile] as any,
      validated: {
        body: {
          missionPublicId: "mission-uuid",
          comment: "I saw a track",
        },
      } as any,
    };
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ publicId: "update-uuid" });
    expect(useCase.execute).toHaveBeenCalledWith(
      {
        missionPublicId: "mission-uuid",
        comment: "I saw a track",
        photoUrl: undefined,
        imageBuffer: fakeFile.buffer,
      },
      "user-uuid"
    );
  });

  it("debe lanzar UserNotFoundError si no hay información de autenticación", async () => {
    const req: Partial<Request> = {
      auth: undefined,
      validated: {
        body: {
          missionPublicId: "mission-uuid",
          comment: "I saw a track",
        },
      } as any,
    };
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});
