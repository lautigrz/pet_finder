import { Request, Response, NextFunction } from "express";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ADMIN_ROLE } from "../../domain/auth/roles";
import { AdminAccessRequiredError } from "../../domain/errors/AdminAccessRequiredError";
import { InvalidAccessTokenError } from "../../domain/errors/InvalidAccessTokenError";
import { asyncHandler } from "../handler/async-handler";

export const requireAdmin = (userRepository: IUserRepository) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const role = await resolveRole(userRepository, req);
    if (role !== ADMIN_ROLE) throw new AdminAccessRequiredError();
    next();
  });

function resolveRole(userRepository: IUserRepository, req: Request): Promise<string | null> {
  const publicId = req.auth?.sub;
  if (!publicId) throw new InvalidAccessTokenError();
  return userRepository.findRoleByPublicId(publicId);
}
