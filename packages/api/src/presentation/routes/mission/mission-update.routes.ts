import { Router } from "express";
import { container } from "tsyringe";

import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { GetMissionUpdatesController } from "@presentation/controller/mission/get-mission-updates.controller";
import { CreateMissionUpdateController } from "@presentation/controller/mission/create-mission-update.controller";
import { ScoreMissionUpdateController } from "@presentation/controller/mission/score-mission-update.controller";
import { GetCommentPointValuesController } from "@presentation/controller/mission/get-comment-point-values.controller";

import { validateRequest } from "@presentation/middleware/validate.request";
import { createMissionUpdateRequestSchema, scoreMissionUpdateRequestSchema } from "@presentation/schemas/mission/mission.schema";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createController = container.resolve(CreateMissionUpdateController);
const getController = container.resolve(GetMissionUpdatesController);
const scoreController = container.resolve(ScoreMissionUpdateController);
const getPointValuesController = container.resolve(GetCommentPointValuesController);

router.get(
  "/point-values",
  requireAuth(tokenSigner),
  getPointValuesController.handle
);

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

router.post(
  "/:publicId/score",
  requireAuth(tokenSigner),
  validateRequest(scoreMissionUpdateRequestSchema),
  scoreController.handle
);

export const missionUpdateRoute = router;
