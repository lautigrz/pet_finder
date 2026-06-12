import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { AuthController } from "../AuthController";
import { LoginUserUseCase } from "../../../application/usecase/login-user/login-user.usecase";
import { LoginUserOutput } from "../../../application/usecase/login-user/login-user.output";
import { InvalidCredentialsError } from "../../../domain/errors/InvalidCredentialsError";
import { LogoutUserUseCase } from "../../../application/usecase/logout-user/logout-user.usecase";
import { RefreshAccessTokenUseCase } from "../../../application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RefreshAccessTokenOutput } from "../../../application/usecase/refresh-access-token/refresh-access-token.output";
import { RequestPasswordResetUseCase } from "../../../application/usecase/request-password-reset/request-password-reset.usecase";
import { ResetPasswordUseCase } from "../../../application/usecase/reset-password/reset-password.usecase";
import { InvalidPasswordResetTokenError } from "../../../domain/errors/InvalidPasswordResetTokenError";
import { invoke } from "./test-helpers";

describe("AuthController", () => {
  let useCase: LoginUserUseCase;
  let logoutUseCase: LogoutUserUseCase;
  let refreshUseCase: RefreshAccessTokenUseCase;
  let requestResetUseCase: RequestPasswordResetUseCase;
  let resetPasswordUseCase: ResetPasswordUseCase;
  let controller: AuthController;
  let res: Partial<Response>;

  beforeEach(() => {
    useCase = { execute: vi.fn() } as unknown as LoginUserUseCase;
    logoutUseCase = { execute: vi.fn() } as unknown as LogoutUserUseCase;
    refreshUseCase = { execute: vi.fn() } as unknown as RefreshAccessTokenUseCase;
    requestResetUseCase = { execute: vi.fn() } as unknown as RequestPasswordResetUseCase;
    resetPasswordUseCase = { execute: vi.fn() } as unknown as ResetPasswordUseCase;
    controller = new AuthController(
      useCase,
      logoutUseCase,
      refreshUseCase,
      requestResetUseCase,
      resetPasswordUseCase,
    );
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  const buildReq = (body: unknown): Partial<Request> => ({ body });

  describe("when credentials are valid", () => {
    it("returns 200 with access and refresh tokens", async () => {
      vi.mocked(useCase.execute).mockResolvedValue(new LoginUserOutput("jwt-access", "refresh-string"));

      const req = buildReq({ email: "juan@example.com", password: "miPass123" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "jwt-access",
        refreshToken: "refresh-string",
      });
    });
  });

  describe("when the body is missing fields", () => {
    it("returns 400 if email is missing", async () => {
      const req = buildReq({ password: "miPass123" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password is missing", async () => {
      const req = buildReq({ email: "juan@example.com" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if email exceeds 255 characters", async () => {
      const longEmail = "a".repeat(250) + "@x.com";
      const req = buildReq({ email: longEmail, password: "miPass123" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 if password exceeds 100 characters", async () => {
      const longPassword = "a".repeat(101);
      const req = buildReq({ email: "juan@example.com", password: longPassword });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("when credentials are invalid", () => {
    it("returns 401 with the domain error message", async () => {
      vi.mocked(useCase.execute).mockRejectedValue(new InvalidCredentialsError());

      const req = buildReq({ email: "juan@example.com", password: "passEquivocada" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("when an unexpected error happens", () => {
    it("returns 500 with a generic error message", async () => {
      vi.mocked(useCase.execute).mockRejectedValue(new Error("db is down"));

      const req = buildReq({ email: "juan@example.com", password: "miPass123" });
      await invoke(controller.login, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("logout", () => {
    it("returns 204 and runs the use case when the body has a refreshToken", async () => {
      const req = buildReq({ refreshToken: "a-refresh-token" });
      await invoke(controller.logout, req, res);

      expect(logoutUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("returns 400 and does NOT run the use case when refreshToken is missing", async () => {
      const req = buildReq({});
      await invoke(controller.logout, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(logoutUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("returns 200 with a new access token when the body is valid", async () => {
      vi.mocked(refreshUseCase.execute).mockResolvedValue(new RefreshAccessTokenOutput("new-access"));

      const req = buildReq({ refreshToken: "a-refresh-token" });
      await invoke(controller.refresh, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: "new-access" });
    });

    it("returns 400 and does NOT run the use case when refreshToken is missing", async () => {
      const req = buildReq({});
      await invoke(controller.refresh, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(refreshUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("returns 200 and runs the use case with a valid email", async () => {
      const req = buildReq({ email: "juan@example.com" });
      await invoke(controller.forgotPassword, req, res);

      expect(requestResetUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 and does NOT run the use case when email is missing", async () => {
      const req = buildReq({});
      await invoke(controller.forgotPassword, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(requestResetUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("returns 200 and runs the use case with token + newPassword", async () => {
      const req = buildReq({ token: "tok-123", newPassword: "nuevaPass123" });
      await invoke(controller.resetPassword, req, res);

      expect(resetPasswordUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when newPassword is too short", async () => {
      const req = buildReq({ token: "tok-123", newPassword: "123" });
      await invoke(controller.resetPassword, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(resetPasswordUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns 400 when the token is invalid/expired", async () => {
      vi.mocked(resetPasswordUseCase.execute).mockRejectedValue(
        new InvalidPasswordResetTokenError("expired"),
      );
      const req = buildReq({ token: "tok-123", newPassword: "nuevaPass123" });
      await invoke(controller.resetPassword, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
