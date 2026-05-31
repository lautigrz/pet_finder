import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { AuthController } from "../AuthController";
import { LoginUserUseCase } from "../../../application/usecase/login-user/login-user.usecase";
import { LoginUserOutput } from "../../../application/usecase/login-user/login-user.output";
import { InvalidCredentialsError } from "../../../domain/errors/InvalidCredentialsError";
import { LogoutUserUseCase } from "../../../application/usecase/logout-user/logout-user.usecase";
import { RefreshAccessTokenUseCase } from "../../../application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RefreshAccessTokenOutput } from "../../../application/usecase/refresh-access-token/refresh-access-token.output";

describe("AuthController", () => {
  let useCase: LoginUserUseCase;
  let logoutUseCase: LogoutUserUseCase;
  let refreshUseCase: RefreshAccessTokenUseCase;
  let controller: AuthController;
  let res: Partial<Response>;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as LoginUserUseCase;
    logoutUseCase = { execute: vi.fn() } as unknown as LogoutUserUseCase;
    refreshUseCase = { execute: vi.fn() } as unknown as RefreshAccessTokenUseCase;
    controller = new AuthController(useCase, logoutUseCase, refreshUseCase);
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  const buildReq = (body: unknown): Partial<Request> => ({ body });

  describe("when credentials are valid", () => {
    it("returns 200 with access and refresh tokens", async () => {
      // Given un use case que devuelve ambos tokens
      vi.mocked(useCase.execute).mockResolvedValue(new LoginUserOutput("jwt-access", "refresh-string"));

      // When llamo al controller con body valido
      const req = buildReq({ email: "juan@example.com", password: "miPass123" });
      await controller.login(req as Request, res as Response);

      // Then devuelve 200 con los 2 tokens
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "jwt-access",
        refreshToken: "refresh-string",
      });
    });
  });

  describe("when the body is missing fields", () => {
    it("returns 400 if email is missing", async () => {
      // Given body sin email
      const req = buildReq({ password: "miPass123" });

      // When llamo al controller
      await controller.login(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password is missing", async () => {
      // Given body sin password
      const req = buildReq({ email: "juan@example.com" });

      // When llamo al controller
      await controller.login(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if email exceeds 255 characters", async () => {
      // Given email muy largo
      const longEmail = "a".repeat(250) + "@x.com";
      const req = buildReq({ email: longEmail, password: "miPass123" });

      // When llamo al controller
      await controller.login(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password exceeds 100 characters", async () => {
      // Given password muy largo
      const longPassword = "a".repeat(101);
      const req = buildReq({ email: "juan@example.com", password: longPassword });

      // When llamo al controller
      await controller.login(req as Request, res as Response);

      // Then devuelve 400 y NO ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("when credentials are invalid", () => {
    it("returns 401 with the domain error message", async () => {
      // Given un use case que lanza InvalidCredentialsError
      vi.mocked(useCase.execute).mockRejectedValue(new InvalidCredentialsError());

      // When llamo al controller con body sintacticamente valido
      const req = buildReq({ email: "juan@example.com", password: "passEquivocada" });
      await controller.login(req as Request, res as Response);

      // Then devuelve 401 sin revelar si fue email o password
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });
  });

  describe("when an unexpected error happens", () => {
    it("returns 500 with a generic error message", async () => {
      // Given un use case que lanza un error inesperado
      vi.mocked(useCase.execute).mockRejectedValue(new Error("db is down"));

      // When llamo al controller
      const req = buildReq({ email: "juan@example.com", password: "miPass123" });
      await controller.login(req as Request, res as Response);

      // Then devuelve 500 sin filtrar detalles internos
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("logout", () => {
    it("returns 204 and runs the use case when the body has a refreshToken", async () => {
      // Given un body con refreshToken
      const req = buildReq({ refreshToken: "a-refresh-token" });

      // When llamo al logout
      await controller.logout(req as Request, res as Response);

      // Then ejecuta el use case y responde 204
      expect(logoutUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("returns 400 and does NOT run the use case when refreshToken is missing", async () => {
      // Given un body sin refreshToken
      const req = buildReq({});

      // When llamo al logout
      await controller.logout(req as Request, res as Response);

      // Then devuelve 400 y no ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(logoutUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("returns 200 with a new access token when the body is valid", async () => {
      // Given un use case que devuelve un access nuevo
      vi.mocked(refreshUseCase.execute).mockResolvedValue(new RefreshAccessTokenOutput("new-access"));

      // When llamo al refresh con un refreshToken
      const req = buildReq({ refreshToken: "a-refresh-token" });
      await controller.refresh(req as Request, res as Response);

      // Then devuelve 200 con el access nuevo
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: "new-access" });
    });

    it("returns 400 and does NOT run the use case when refreshToken is missing", async () => {
      // Given un body sin refreshToken
      const req = buildReq({});

      // When llamo al refresh
      await controller.refresh(req as Request, res as Response);

      // Then devuelve 400 y no ejecuta el use case
      expect(res.status).toHaveBeenCalledWith(400);
      expect(refreshUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
