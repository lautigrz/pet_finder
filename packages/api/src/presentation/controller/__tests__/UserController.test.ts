import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { UserController } from "../UserController";
import { CreateUserUseCase } from "../../../application/usecase/create-user/create-user.usecase";
import { CreateUserOutput } from "../../../application/usecase/create-user/create-user.output";
import { SendEmailVerificationUseCase } from "../../../application/usecase/send-email-verification/send-email-verification.usecase";
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

describe("UserController", () => {
  let createUserUseCase: CreateUserUseCase;
  let sendEmailVerificationUseCase: SendEmailVerificationUseCase;
  let verifyEmailUseCase: VerifyEmailUseCase;
  let updateProfileUseCase: UpdateProfileUseCase;
  let getProfileUseCase: GetProfileUseCase;
  let cloudinaryService: ClaudinaryService;
  let getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase;
  let updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase;

  let controller: UserController;
  let res: Partial<Response>;

  beforeEach(() => {
    createUserUseCase = { execute: vi.fn() } as unknown as CreateUserUseCase;
    sendEmailVerificationUseCase = { execute: vi.fn() } as unknown as SendEmailVerificationUseCase;
    verifyEmailUseCase = { execute: vi.fn() } as unknown as VerifyEmailUseCase;
    updateProfileUseCase = { execute: vi.fn() } as unknown as UpdateProfileUseCase;
    getProfileUseCase = { execute: vi.fn(), } as unknown as GetProfileUseCase;
    cloudinaryService = { upload: vi.fn() } as unknown as ClaudinaryService;
    getNotificationPreferencesUseCase = {
      execute: vi.fn(),
    } as unknown as GetNotificationPreferencesUseCase;

    updateNotificationPreferencesUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateNotificationPreferencesUseCase;

    controller = new UserController(createUserUseCase, sendEmailVerificationUseCase, verifyEmailUseCase, updateProfileUseCase, getProfileUseCase, cloudinaryService, updateNotificationPreferencesUseCase, getNotificationPreferencesUseCase);
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  const buildReq = (body: unknown): Partial<Request> => ({ body });
  const validCreateOutput = new CreateUserOutput("user-abc", 42, "juan@example.com");

  describe("create — when the use case succeeds", () => {
    it("returns 201 with the user id and triggers email verification", async () => {
      // Given un use case que crea el usuario correctamente
      vi.mocked(createUserUseCase.execute).mockResolvedValue(validCreateOutput);

      // When llamo al controller con body valido
      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await controller.create(req as Request, res as Response);

      // Then devuelve 201 y dispara el envio de verificacion
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "user-abc" });
      expect(sendEmailVerificationUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("create — when the body is missing fields", () => {
    it("returns 400 if email is missing", async () => {
      // Given body sin email
      const req = buildReq({ username: "juancho", password: "miPass123" });

      // When llamo al controller
      await controller.create(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta los use cases
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createUserUseCase.execute).not.toHaveBeenCalled();
      expect(sendEmailVerificationUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password is missing", async () => {
      // Given body sin password
      const req = buildReq({ email: "juan@example.com", username: "juancho" });

      // When llamo al controller
      await controller.create(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta los use cases
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password is shorter than 8 characters", async () => {
      // Given password de 3 chars
      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "123" });

      // When llamo al controller
      await controller.create(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta los use cases
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("create — when the email format is invalid", () => {
    it("returns 400 when the use case throws InvalidEmailError", async () => {
      // Given un use case que lanza InvalidEmailError
      vi.mocked(createUserUseCase.execute).mockRejectedValue(new InvalidEmailError("no-es-email"));

      // When llamo al controller con body sintacticamente valido
      const req = buildReq({ email: "no-es-email", username: "juancho", password: "miPass123" });
      await controller.create(req as Request, res as Response);

      // Then devuelve 400 con el mensaje del error de dominio
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email format: no-es-email",
      });
    });
  });

  describe("create — when the email is already registered", () => {
    it("returns 409 with the domain error message", async () => {
      // Given un use case que lanza EmailAlreadyExistsError
      vi.mocked(createUserUseCase.execute).mockRejectedValue(
        new EmailAlreadyExistsError("juan@example.com"),
      );

      // When llamo al controller
      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await controller.create(req as Request, res as Response);

      // Then devuelve 409 con el mensaje del error
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email already registered: juan@example.com",
      });
    });
  });

  describe("create — when an unexpected error happens", () => {
    it("returns 500 with a generic error message", async () => {
      // Given un use case que lanza un error inesperado
      vi.mocked(createUserUseCase.execute).mockRejectedValue(new Error("db is down"));

      // When llamo al controller
      const req = buildReq({ email: "juan@example.com", username: "juancho", password: "miPass123" });
      await controller.create(req as Request, res as Response);

      // Then devuelve 500 sin filtrar detalles internos
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("verifyEmail — when the token is valid", () => {
    it("returns 200 with verified true", async () => {
      // Given un use case que verifica correctamente
      vi.mocked(verifyEmailUseCase.execute).mockResolvedValue(undefined);

      // When llamo al controller
      const req = buildReq({ token: "valid-token-string" });
      await controller.verifyEmail(req as Request, res as Response);

      // Then devuelve 200 confirmando la verificacion
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ verified: true });
    });
  });

  describe("verifyEmail — when the token body is missing", () => {
    it("returns 400 without calling the use case", async () => {
      // Given body sin token
      const req = buildReq({});

      // When llamo al controller
      await controller.verifyEmail(req as Request, res as Response);

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(verifyEmailUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("verifyEmail — when the token is invalid", () => {
    it("returns 400 with the reason", async () => {
      // Given un use case que lanza InvalidVerificationTokenError
      vi.mocked(verifyEmailUseCase.execute).mockRejectedValue(
        new InvalidVerificationTokenError("expired"),
      );

      // When llamo al controller
      const req = buildReq({ token: "expired-token" });
      await controller.verifyEmail(req as Request, res as Response);

      // Then devuelve 400 con la razon especifica
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid verification token: expired",
        reason: "expired",
      });
    });
  });

  describe("updateProfile — when the update succeeds", () => {
    it("returns 200 with the updated user", async () => {
      // Given un usuario autenticado y un update exitoso
      vi.mocked(updateProfileUseCase.execute).mockResolvedValue({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: null,
      });

      const req = {
        body: {
          username: "facu_updated",
          name: "Facundo",
          lastname: "Pereira",
        },
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.updateProfile(req as Request, res as Response);

      // Then devuelve 200 con el usuario actualizado
      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: null,
      });
    });
  });

  describe("updateProfile — when body fields are invalid", () => {
    it("returns 400 if username is not a string", async () => {
      // Given username invalido
      const req = {
        body: {
          username: 123,
        },
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.updateProfile(req as Request, res as Response);

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);

      expect(updateProfileUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("updateProfile — when the user does not exist", () => {
    it("returns 404", async () => {
      // Given un use case que lanza UserNotFoundError
      vi.mocked(updateProfileUseCase.execute).mockRejectedValue(
        new UserNotFoundError(),
      );

      const req = {
        body: {
          username: "nuevo_username",
        },
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.updateProfile(req as Request, res as Response);

      // Then devuelve 404
      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });
  });
  describe("updateProfile — when an unexpected error happens", () => {
    it("returns 500", async () => {
      // Given un error inesperado
      vi.mocked(updateProfileUseCase.execute).mockRejectedValue(
        new Error("db down"),
      );

      const req = {
        body: {
          username: "nuevo_username",
        },
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.updateProfile(req as Request, res as Response);

      // Then devuelve 500
      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("getProfile — when the user exists", () => {
    it("returns 200 with the user profile", async () => {
      // Given un usuario autenticado
      vi.mocked(getProfileUseCase.execute).mockResolvedValue({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: undefined,
      });

      const req = {
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.getProfile(req as Request, res as Response);

      // Then devuelve 200 con el perfil
      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        id: "user-123",
        email: "facu@test.com",
        username: "facu_updated",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: undefined,
      });
    });
  });

  describe("getProfile — when the user does not exist", () => {
    it("returns 404", async () => {
      // Given un use case que lanza UserNotFoundError
      vi.mocked(getProfileUseCase.execute).mockRejectedValue(
        new UserNotFoundError(),
      );

      const req = {
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.getProfile(req as Request, res as Response);

      // Then devuelve 404
      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });
  });

  describe("getProfile — when an unexpected error happens", () => {
    it("returns 500", async () => {
      // Given un error inesperado
      vi.mocked(getProfileUseCase.execute).mockRejectedValue(
        new Error("db down"),
      );

      const req = {
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.getProfile(req as Request, res as Response);

      // Then devuelve 500
      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("uploadProfilePhoto — when the upload succeeds", () => {
    it("uploads the file to Cloudinary, updates the user photoUrl and returns 200", async () => {
      // Given una imagen recibida por multer
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
        auth: {
          sub: "user-123",
        },
        file: {
          buffer: fileBuffer,
        },
      } as Partial<Request> & { file: Express.Multer.File };

      // When llamo al controller
      await controller.uploadProfilePhoto(req as Request, res as Response);

      // Then sube la imagen a Cloudinary
      expect(cloudinaryService.upload).toHaveBeenCalledWith(
        fileBuffer,
        "profiles",
      );

      // Then actualiza el perfil del usuario con la URL devuelta
      expect(updateProfileUseCase.execute).toHaveBeenCalledOnce();

      const firstCall = vi.mocked(updateProfileUseCase.execute).mock.calls[0];
      expect(firstCall).toBeDefined();

      const input = firstCall![0];

      expect(input).toEqual(
        expect.objectContaining({
          publicId: "user-123",
          photoUrl: "https://res.cloudinary.com/demo/profile.jpg",
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        id: "user-123",
        email: "facu@test.com",
        username: "facundo",
        name: "Facundo",
        lastname: "Pereira",
        photoUrl: "https://res.cloudinary.com/demo/profile.jpg",
      });
    });
  });

  describe("uploadProfilePhoto — when no file is sent", () => {
    it("returns 400 and does not call Cloudinary", async () => {
      // Given request autenticado pero sin archivo
      const req = {
        auth: {
          sub: "user-123",
        },
      } as Partial<Request>;

      // When llamo al controller
      await controller.uploadProfilePhoto(req as Request, res as Response);

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        error: "photo is required",
      });

      expect(cloudinaryService.upload).not.toHaveBeenCalled();
      expect(updateProfileUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("uploadProfilePhoto — when Cloudinary fails", () => {
    it("returns 500", async () => {
      // Given Cloudinary falla
      vi.mocked(cloudinaryService.upload).mockRejectedValue(
        new Error("cloudinary down"),
      );

      const req = {
        auth: {
          sub: "user-123",
        },
        file: {
          buffer: Buffer.from("fake-image"),
        },
      } as Partial<Request> & { file: Express.Multer.File };

      // When llamo al controller
      await controller.uploadProfilePhoto(req as Request, res as Response);

      // Then devuelve 500
      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("getNotificationPreferences — when preferences exist", () => {
    it("returns 200 with the current notification preferences", async () => {
      // Given preferencias existentes para el usuario autenticado
      const mutedUntil = new Date("2026-06-15T18:00:00.000Z");

      vi.mocked(getNotificationPreferencesUseCase.execute).mockResolvedValue({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: false,
        matchesEnabled: true,
        mutedUntil,
      });

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
      } as Partial<Request>;

      // When consulto las preferencias
      await controller.getNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then consulta por el publicId autenticado y devuelve 200
      expect(getNotificationPreferencesUseCase.execute).toHaveBeenCalledWith(
        "facundo-public-id",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: false,
        matchesEnabled: true,
        mutedUntil,
      });
    });
  });

  describe("getNotificationPreferences — when an unexpected error happens", () => {
    it("returns 500", async () => {
      // Given un error inesperado
      vi.mocked(getNotificationPreferencesUseCase.execute).mockRejectedValue(
        new Error("database unavailable"),
      );

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
      } as Partial<Request>;

      // When consulto las preferencias
      await controller.getNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve error genérico
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("updateNotificationPreferences — when the request is valid", () => {
    it("returns 200 with the updated notification preferences", async () => {
      // Given preferencias válidas
      const mutedUntilText = "2026-06-15T18:00:00.000Z";
      const mutedUntil = new Date(mutedUntilText);

      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockResolvedValue({
        notificationRadius: 10,
        lostReportsEnabled: false,
        sightingReportsEnabled: true,
        matchesEnabled: false,
        mutedUntil,
      });

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          notificationRadius: 10,
          lostReportsEnabled: false,
          sightingReportsEnabled: true,
          matchesEnabled: false,
          mutedUntil: mutedUntilText,
        },
      } as Partial<Request>;

      // When actualizo las preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then ejecuta el use case y devuelve 200
      expect(updateNotificationPreferencesUseCase.execute).toHaveBeenCalledOnce();

      const firstCall = vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mock.calls[0];

      expect(firstCall).toBeDefined();

      const input = firstCall![0];

      expect(input).toEqual(
        expect.objectContaining({
          userPublicId: "facundo-public-id",
          notificationRadius: 10,
          lostReportsEnabled: false,
          sightingReportsEnabled: true,
          matchesEnabled: false,
          mutedUntil,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        notificationRadius: 10,
        lostReportsEnabled: false,
        sightingReportsEnabled: true,
        matchesEnabled: false,
        mutedUntil,
      });
    });

    it("allows a partial update", async () => {
      // Given un PATCH que modifica solo el radio
      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockResolvedValue({
        notificationRadius: 15,
        lostReportsEnabled: true,
        sightingReportsEnabled: true,
        matchesEnabled: true,
        mutedUntil: null,
      });

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          notificationRadius: 15,
        },
      } as Partial<Request>;

      // When actualizo solo el radio
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve las preferencias actualizadas
      expect(res.status).toHaveBeenCalledWith(200);
      expect(updateNotificationPreferencesUseCase.execute).toHaveBeenCalledOnce();
    });

    it("allows removing mute with null", async () => {
      // Given mutedUntil explícitamente en null
      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockResolvedValue({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: true,
        matchesEnabled: true,
        mutedUntil: null,
      });

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          mutedUntil: null,
        },
      } as Partial<Request>;

      // When desactivo el mute temporal
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then el input conserva null
      const firstCall = vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mock.calls[0];

      expect(firstCall).toBeDefined();
      expect(firstCall![0].mutedUntil).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateNotificationPreferences — when the body is invalid", () => {
    it("returns 400 when no preference is provided", async () => {
      // Given body vacío
      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {},
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400 y no ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(
        updateNotificationPreferencesUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when notificationRadius is not an integer", async () => {
      // Given radio decimal
      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          notificationRadius: 5.5,
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(
        updateNotificationPreferencesUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when a toggle is not boolean", async () => {
      // Given toggle inválido
      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          lostReportsEnabled: "yes",
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(
        updateNotificationPreferencesUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when mutedUntil is not a string or null", async () => {
      // Given fecha con tipo incorrecto
      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          mutedUntil: 123,
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(
        updateNotificationPreferencesUseCase.execute,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateNotificationPreferences — when domain validation fails", () => {
    it("returns 400 for InvalidNotificationRadiusError", async () => {
      // Given error de radio inválido
      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockRejectedValue(new InvalidNotificationRadiusError());

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          notificationRadius: 10,
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for InvalidMutedUntilError", async () => {
      // Given error de fecha inválida
      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockRejectedValue(new InvalidMutedUntilError());

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          mutedUntil: "2026-06-15T18:00:00.000Z",
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 400
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 for an unexpected error", async () => {
      // Given error inesperado
      vi.mocked(
        updateNotificationPreferencesUseCase.execute,
      ).mockRejectedValue(new Error("database unavailable"));

      const req = {
        auth: {
          sub: "facundo-public-id",
        },
        body: {
          notificationRadius: 10,
        },
      } as Partial<Request>;

      // When actualizo preferencias
      await controller.updateNotificationPreferences(
        req as Request,
        res as Response,
      );

      // Then devuelve 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });


});
