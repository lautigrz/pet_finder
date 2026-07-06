import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { CreateUserController } from "../user/create-user.controller";
import { VerifyEmailController } from "../user/verify-email.controller";
import { UpdateProfileController } from "../user/update-profile.controller";
import { GetProfileController } from "../user/get-profile.controller";
import { UploadProfilePhotoController } from "../user/upload-profile-photo.controller";
import { GetNotificationPreferencesController } from "../user/get-notification-preferences.controller";
import { UpdateNotificationPreferencesController } from "../user/update-notification-preferences.controller";
import { RegisterUserUseCase } from "../../../application/usecase/register-user/register-user.usecase";
import { RegisterUserOutput } from "../../../application/usecase/register-user/register-user.output";
import { VerifyEmailUseCase } from "../../../application/usecase/verify-email/verify-email.usecase";
import { EmailAlreadyExistsError } from "../../../domain/errors/EmailAlreadyExistsError";
import { InvalidEmailError } from "../../../domain/errors/InvalidEmailError";
import { InvalidVerificationTokenError } from "../../../domain/errors/InvalidVerificationTokenError";
import { UpdateProfileUseCase } from "../../../application/usecase/update-profile/update-profile.usecase";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError";
import { GetProfileUseCase } from "../../../application/usecase/get-profile/get-profile.usecase";
import { ClaudinaryService } from "../../../infrastructure/storage/CloudinaryService";
import { GetNotificationPreferencesUseCase } from "../../../application/usecase/get-notification-preferences/get-notification-preferences.usecase";
import { UpdateNotificationPreferencesUseCase } from "../../../application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { InvalidNotificationRadiusError } from "../../../domain/errors/InvalidNotificationRadiusError";
import { InvalidMutedUntilError } from "../../../domain/errors/InvalidMutedUntilError";
import { invoke } from "./test-helpers";

describe("User Controllers", () => {
  let registerUserUseCase: RegisterUserUseCase;
  let verifyEmailUseCase: VerifyEmailUseCase;
  let updateProfileUseCase: UpdateProfileUseCase;
  let getProfileUseCase: GetProfileUseCase;
  let cloudinaryService: ClaudinaryService;
  let getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase;
  let updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase;

  let createUserController: CreateUserController;
  let verifyEmailController: VerifyEmailController;
  let updateProfileController: UpdateProfileController;
  let getProfileController: GetProfileController;
  let uploadProfilePhotoController: UploadProfilePhotoController;
  let getNotificationPreferencesController: GetNotificationPreferencesController;
  let updateNotificationPreferencesController: UpdateNotificationPreferencesController;
  let res: Partial<Response>;

  beforeEach(() => {
    registerUserUseCase = { execute: vi.fn() } as unknown as RegisterUserUseCase;
    verifyEmailUseCase = { execute: vi.fn() } as unknown as VerifyEmailUseCase;
    updateProfileUseCase = { execute: vi.fn() } as unknown as UpdateProfileUseCase;
    getProfileUseCase = { execute: vi.fn() } as unknown as GetProfileUseCase;
    cloudinaryService = { upload: vi.fn() } as unknown as ClaudinaryService;
    getNotificationPreferencesUseCase = { execute: vi.fn() } as unknown as GetNotificationPreferencesUseCase;
    updateNotificationPreferencesUseCase = { execute: vi.fn() } as unknown as UpdateNotificationPreferencesUseCase;

    createUserController = new CreateUserController(registerUserUseCase);
    verifyEmailController = new VerifyEmailController(verifyEmailUseCase);
    updateProfileController = new UpdateProfileController(updateProfileUseCase);
    getProfileController = new GetProfileController(getProfileUseCase);
    uploadProfilePhotoController = new UploadProfilePhotoController(updateProfileUseCase, cloudinaryService);
    getNotificationPreferencesController = new GetNotificationPreferencesController(getNotificationPreferencesUseCase);
    updateNotificationPreferencesController = new UpdateNotificationPreferencesController(updateNotificationPreferencesUseCase);

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  const buildReq = (body: unknown): Partial<Request> => ({ body, validated: { body } });
  const validCreateOutput = new RegisterUserOutput("user-abc");

  describe("create — when the use case succeeds", () => {
    it("returns 201 with the user id", async () => {
      vi.mocked(registerUserUseCase.execute).mockResolvedValue(validCreateOutput);

      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await invoke(createUserController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "user-abc" });
      expect(registerUserUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("create — when the email format is invalid", () => {
    it("returns 400 when the use case throws InvalidEmailError", async () => {
      vi.mocked(registerUserUseCase.execute).mockRejectedValue(new InvalidEmailError("no-es-email"));

      const req = buildReq({ email: "no-es-email", username: "juancho", password: "miPass123" });
      await invoke(createUserController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("create — when the email is already registered", () => {
    it("returns 409 with the domain error message", async () => {
      vi.mocked(registerUserUseCase.execute).mockRejectedValue(
        new EmailAlreadyExistsError("juan@example.com"),
      );

      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await invoke(createUserController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("create — when an unexpected error happens", () => {
    it("returns 500 with a generic error message", async () => {
      vi.mocked(registerUserUseCase.execute).mockRejectedValue(new Error("db is down"));

      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await invoke(createUserController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("verifyEmail — when the token is valid", () => {
    it("returns 200 with verified true", async () => {
      vi.mocked(verifyEmailUseCase.execute).mockResolvedValue(undefined);

      const req = buildReq({ token: "valid-token-string" });
      await invoke(verifyEmailController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ verified: true });
    });
  });

  describe("verifyEmail — when the token is invalid", () => {
    it("returns 400 with the reason", async () => {
      vi.mocked(verifyEmailUseCase.execute).mockRejectedValue(
        new InvalidVerificationTokenError("expired"),
      );

      const req = buildReq({ token: "expired-token" });
      await invoke(verifyEmailController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateProfile — when the update succeeds", () => {
    it("returns 200 with the updated user", async () => {
      vi.mocked(updateProfileUseCase.execute).mockResolvedValue({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: null,
      });

      const req = {
        body: { username: "facu_updated", name: "Facundo", lastname: "Pereira" },
        validated: { body: { username: "facu_updated", name: "Facundo", lastname: "Pereira" } },
        auth: { sub: "user-123" },
      } as Partial<Request>;

      await invoke(updateProfileController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateProfile — when the user does not exist", () => {
    it("returns 404", async () => {
      vi.mocked(updateProfileUseCase.execute).mockRejectedValue(new UserNotFoundError());

      const req = {
        body: { username: "nuevo_username" },
        validated: { body: { username: "nuevo_username" } },
        auth: { sub: "user-123" },
      } as Partial<Request>;

      await invoke(updateProfileController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getProfile — when the user exists", () => {
    it("returns 200 with the user profile", async () => {
      vi.mocked(getProfileUseCase.execute).mockResolvedValue({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: undefined,
      });

      const req = { auth: { sub: "user-123" } } as Partial<Request>;

      await invoke(getProfileController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getProfile — when the user does not exist", () => {
    it("returns 404", async () => {
      vi.mocked(getProfileUseCase.execute).mockRejectedValue(new UserNotFoundError());

      const req = { auth: { sub: "user-123" } } as Partial<Request>;
      await invoke(getProfileController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("uploadProfilePhoto — when the upload succeeds", () => {
    it("uploads the file to Cloudinary, updates the user photoUrl and returns 200", async () => {
      const fileBuffer = Buffer.from("fake-image");

      vi.mocked(cloudinaryService.upload).mockResolvedValue({
        url: "https://res.cloudinary.com/demo/profile.jpg",
        publicId: "profiles/profile-image",
      });

      vi.mocked(updateProfileUseCase.execute).mockResolvedValue({
        id: "user-123",
        email: "facu@test.com",
        username: "facundo",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: "https://res.cloudinary.com/demo/profile.jpg",
      });

      const req = {
        auth: { sub: "user-123" },
        file: { buffer: fileBuffer },
      } as Partial<Request> & { file: Express.Multer.File };

      await invoke(uploadProfilePhotoController.handle, req, res);

      expect(cloudinaryService.upload).toHaveBeenCalledWith(fileBuffer, "profiles");
      expect(updateProfileUseCase.execute).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadProfilePhoto — when no file is sent", () => {
    it("returns 400 and does not call Cloudinary", async () => {
      const req = { auth: { sub: "user-123" } } as Partial<Request>;

      await invoke(uploadProfilePhotoController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(cloudinaryService.upload).not.toHaveBeenCalled();
    });
  });

  describe("getNotificationPreferences — when preferences exist", () => {
    it("returns 200 with the current notification preferences", async () => {
      const mutedUntil = new Date("2026-06-15T18:00:00.000Z");

      vi.mocked(getNotificationPreferencesUseCase.execute).mockResolvedValue({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: false,
        matchesEnabled: true,
        mutedUntil,
      });

      const req = { auth: { sub: "facundo-public-id" } } as Partial<Request>;

      await invoke(getNotificationPreferencesController.handle, req, res);

      expect(getNotificationPreferencesUseCase.execute).toHaveBeenCalledWith("facundo-public-id");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateNotificationPreferences — when the request is valid", () => {
    it("returns 200 with the updated notification preferences", async () => {
      const mutedUntilText = "2026-06-15T18:00:00.000Z";
      const mutedUntil = new Date(mutedUntilText);

      vi.mocked(updateNotificationPreferencesUseCase.execute).mockResolvedValue({
        notificationRadius: 10,
        lostReportsEnabled: false,
        sightingReportsEnabled: true,
        matchesEnabled: false,
        mutedUntil,
      });

      const req = {
        auth: { sub: "facundo-public-id" },
        body: { notificationRadius: 10, lostReportsEnabled: false, sightingReportsEnabled: true, matchesEnabled: false, mutedUntil: mutedUntilText },
        validated: { body: { notificationRadius: 10, lostReportsEnabled: false, sightingReportsEnabled: true, matchesEnabled: false, mutedUntil: mutedUntilText } },
      } as Partial<Request>;

      await invoke(updateNotificationPreferencesController.handle, req, res);

      expect(updateNotificationPreferencesUseCase.execute).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateNotificationPreferences — when domain validation fails", () => {
    it("returns 400 for InvalidNotificationRadiusError", async () => {
      vi.mocked(updateNotificationPreferencesUseCase.execute).mockRejectedValue(
        new InvalidNotificationRadiusError(),
      );

      const req = {
        auth: { sub: "facundo-public-id" },
        body: { notificationRadius: 10 },
        validated: { body: { notificationRadius: 10 } },
      } as Partial<Request>;

      await invoke(updateNotificationPreferencesController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for InvalidMutedUntilError", async () => {
      vi.mocked(updateNotificationPreferencesUseCase.execute).mockRejectedValue(
        new InvalidMutedUntilError(),
      );

      const req = {
        auth: { sub: "facundo-public-id" },
        body: { mutedUntil: "2026-06-15T18:00:00.000Z" },
        validated: { body: { mutedUntil: "2026-06-15T18:00:00.000Z" } },
      } as Partial<Request>;

      await invoke(updateNotificationPreferencesController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 for an unexpected error", async () => {
      vi.mocked(updateNotificationPreferencesUseCase.execute).mockRejectedValue(
        new Error("database unavailable"),
      );

      const req = {
        auth: { sub: "facundo-public-id" },
        body: { notificationRadius: 10 },
        validated: { body: { notificationRadius: 10 } },
      } as Partial<Request>;

      await invoke(updateNotificationPreferencesController.handle, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
