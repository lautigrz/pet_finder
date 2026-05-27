import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireAuth } from "../requireAuth.middleware";
import { InvalidAccessTokenError } from "../../../domain/errors/InvalidAccessTokenError";
import type { ITokenSigner, AccessTokenPayload } from "../../../domain/services/ITokenSigner";

const VALID_PAYLOAD: AccessTokenPayload = {
  sub: "uuid-fake",
  email: "juan@example.com",
  isVerified: true,
};

describe("requireAuth middleware", () => {
  let tokenSigner: ITokenSigner;
  let middleware: ReturnType<typeof requireAuth>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    tokenSigner = { sign: vi.fn(), verify: vi.fn() };
    middleware = requireAuth(tokenSigner);
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe("when the Authorization header is missing", () => {
    it("returns 401 and does not call next", () => {
      // Given una request sin Authorization header
      req = { headers: {} };

      // When ejecuto el middleware
      middleware(req as Request, res as Response, next);

      // Then devuelve 401 y no se llama next
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the Authorization header is not Bearer", () => {
    it("returns 401 and does not call next", () => {
      // Given una request con header tipo Basic
      req = { headers: { authorization: "Basic abc" } };

      // When ejecuto el middleware
      middleware(req as Request, res as Response, next);

      // Then devuelve 401
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the token is invalid", () => {
    it("returns 401 with the domain error message", () => {
      // Given un signer que lanza InvalidAccessTokenError
      req = { headers: { authorization: "Bearer expired-or-tampered" } };
      vi.mocked(tokenSigner.verify).mockImplementation(() => {
        throw new InvalidAccessTokenError();
      });

      // When ejecuto el middleware
      middleware(req as Request, res as Response, next);

      // Then devuelve 401 y no se llama next
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired access token" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when the token is valid", () => {
    it("populates req.auth and calls next", () => {
      // Given un signer que devuelve un payload valido
      req = { headers: { authorization: "Bearer good-jwt" } };
      vi.mocked(tokenSigner.verify).mockReturnValue(VALID_PAYLOAD);

      // When ejecuto el middleware
      middleware(req as Request, res as Response, next);

      // Then se popula req.auth y se llama next
      expect(req.auth).toEqual(VALID_PAYLOAD);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
