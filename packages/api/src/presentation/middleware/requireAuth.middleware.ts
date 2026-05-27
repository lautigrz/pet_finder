import { NextFunction, Request, Response } from "express";
import { AccessTokenPayload, ITokenSigner } from "../../domain/services/ITokenSigner";
import { InvalidAccessTokenError } from "../../domain/errors/InvalidAccessTokenError";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AccessTokenPayload;
  }
}

export const requireAuth =
  (tokenSigner: ITokenSigner) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Missing access token" });
      return;
    }
    try {
      req.auth = tokenSigner.verify(token);
      next();
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        res.status(401).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}
