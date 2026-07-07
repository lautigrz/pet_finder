import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { requireAdmin } from "src/presentation/middleware/requireAdmin.middleware";
import { GetAdminStatsController } from "@presentation/controller/stats/get-admin-stats.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const userRepository = container.resolve<IUserRepository>("UserRepository");

const getAdminStats = container.resolve(GetAdminStatsController);

router.get("/", requireAuth(tokenSigner), requireAdmin(userRepository), getAdminStats.handle);

export const statsRoute = router;
