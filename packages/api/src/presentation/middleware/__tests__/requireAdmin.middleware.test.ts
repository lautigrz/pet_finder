import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireAdmin } from "../requireAdmin.middleware";
import { AdminAccessRequiredError } from "../../../domain/errors/AdminAccessRequiredError";
import { InvalidAccessTokenError } from "../../../domain/errors/InvalidAccessTokenError";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";

describe("requireAdmin middleware", () => {
  let userRepository: Pick<IUserRepository, "findRoleByPublicId">;
  let middleware: ReturnType<typeof requireAdmin>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    userRepository = { findRoleByPublicId: vi.fn() };
    middleware = requireAdmin(userRepository as IUserRepository);
    res = {};
    next = vi.fn();
    req = { auth: { sub: "uuid-fake", email: "admin@example.com", isVerified: true } };
  });

  describe("when the user has the ADMIN role", () => {
    it("calls next without error", async () => {
      // Given un usuario con rol ADMIN
      vi.mocked(userRepository.findRoleByPublicId).mockResolvedValue("ADMIN");

      // When ejecuto el middleware
      await middleware(req as Request, res as Response, next);

      // Then deja pasar
      expect(userRepository.findRoleByPublicId).toHaveBeenCalledWith("uuid-fake");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("when the user does not have the ADMIN role", () => {
    it("forwards an AdminAccessRequiredError", async () => {
      // Given un usuario con rol no admin
      vi.mocked(userRepository.findRoleByPublicId).mockResolvedValue("USER");

      // When ejecuto el middleware
      await middleware(req as Request, res as Response, next);

      // Then bloquea con el error de dominio
      expect(next).toHaveBeenCalledWith(expect.any(AdminAccessRequiredError));
    });
  });

  describe("when the user has no role assigned", () => {
    it("forwards an AdminAccessRequiredError", async () => {
      // Given un usuario sin rol
      vi.mocked(userRepository.findRoleByPublicId).mockResolvedValue(null);

      // When ejecuto el middleware
      await middleware(req as Request, res as Response, next);

      // Then bloquea
      expect(next).toHaveBeenCalledWith(expect.any(AdminAccessRequiredError));
    });
  });

  describe("when the request is not authenticated", () => {
    it("forwards an InvalidAccessTokenError without hitting the repository", async () => {
      // Given una request sin auth
      req = {};

      // When ejecuto el middleware
      await middleware(req as Request, res as Response, next);

      // Then no consulta el repo y bloquea
      expect(userRepository.findRoleByPublicId).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidAccessTokenError));
    });
  });
});
