import { Router } from "express";
import { container } from "tsyringe";

import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { GetMissionUpdatesController } from "@presentation/controller/mission/get-mission-updates.controller";
import { CreateMissionUpdateController } from "@presentation/controller/mission/create-mission-update.controller";

import { validateRequest } from "@presentation/middleware/validate.request";
import { createMissionUpdateRequestSchema } from "@presentation/schemas/mission/mission.schema";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createController = container.resolve(CreateMissionUpdateController);
const getController = container.resolve(GetMissionUpdatesController);

router.get(
  "/:publicId",
  requireAuth(tokenSigner),
  getController.handle
);

router.post(
  "/",
  requireAuth(tokenSigner),
  validateRequest(createMissionUpdateRequestSchema),
  createController.handle
);

export const missionUpdateRoute = router;
