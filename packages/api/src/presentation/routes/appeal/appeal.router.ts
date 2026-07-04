import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { requireAdmin } from "src/presentation/middleware/requireAdmin.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createAppealRequestSchema, appealQueueSchema, resolveAppealRequestSchema } from "src/presentation/schemas/appeal/appeal.schema";
import { CreateAppealController } from "@presentation/controller/appeal/create-appeal.controller";
import { GetAppealQueueController } from "@presentation/controller/appeal/get-appeal-queue.controller";
import { ResolveAppealController } from "@presentation/controller/appeal/resolve-appeal.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const userRepository = container.resolve<IUserRepository>("UserRepository");

const createAppeal = container.resolve(CreateAppealController);
const getAppealQueue = container.resolve(GetAppealQueueController);
const resolveAppeal = container.resolve(ResolveAppealController);

router.post("/", validateRequest(createAppealRequestSchema), createAppeal.handle);
router.get("/", requireAuth(tokenSigner), requireAdmin(userRepository), validateRequest(appealQueueSchema), getAppealQueue.handle);
router.patch("/:publicId", requireAuth(tokenSigner), requireAdmin(userRepository), validateRequest(resolveAppealRequestSchema), resolveAppeal.handle);

export const appealRoute = router;
