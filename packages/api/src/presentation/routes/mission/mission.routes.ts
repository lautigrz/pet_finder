import { Router } from "express";
import { container } from "tsyringe";

import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";

import { CreateMissionController } from "@presentation/controller/mission/create-mission.controller";
import { GetMissionsController } from "@presentation/controller/mission/get-missions.controller";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createController = container.resolve(CreateMissionController);
const getController = container.resolve(GetMissionsController);

router.get(
  "/",
  getController.handle
);

router.post(
  "/",
  requireAuth(tokenSigner),
  createController.handle
);

export const missionRoute = router;