import { Router } from "express";
import { container } from "tsyringe";

import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";

import { CreateMissionController } from "@presentation/controller/mission/create-mission.controller";
import { GetMissionsController } from "@presentation/controller/mission/get-missions.controller";
import { GetMissionDetailController } from "@presentation/controller/mission/get-mission-detail.controller";
import { JoinMissionController } from "@presentation/controller/mission/join-mission.controller";
import { LeaveMissionController } from "@presentation/controller/mission/leave-mission.controller";
import { CancelMissionController } from "@presentation/controller/mission/cancel-mission.controller";
import { GetJoinedMissionsController } from "@presentation/controller/mission/get-joined-missions.controller";
import { UpdateMissionController } from "@presentation/controller/mission/update-mission.controller";
import { PostCoverageController } from "@presentation/controller/mission/post-coverage.controller";
import { GetCoverageController } from "@presentation/controller/mission/get-coverage.controller";

import { validateRequest } from "@presentation/middleware/validate.request";
import { createMissionRequestSchema, updateMissionRequestSchema } from "@presentation/schemas/mission/mission.schema";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createController = container.resolve(CreateMissionController);
const getController = container.resolve(GetMissionsController);
const getDetailController = container.resolve(GetMissionDetailController);
const joinController = container.resolve(JoinMissionController);
const leaveController = container.resolve(LeaveMissionController);
const cancelController = container.resolve(CancelMissionController);
const getJoinedController = container.resolve(GetJoinedMissionsController);
const updateController = container.resolve(UpdateMissionController);
const postCoverageController = container.resolve(PostCoverageController);
const getCoverageController = container.resolve(GetCoverageController);

router.get(
  "/",
  requireAuth(tokenSigner),
  getController.handle
);

router.get(
  "/joined",
  requireAuth(tokenSigner),
  getJoinedController.handle
);

router.post(
  "/",
  requireAuth(tokenSigner),
  validateRequest(createMissionRequestSchema),
  createController.handle
);

router.get(
  "/:publicId",
  requireAuth(tokenSigner),
  getDetailController.handle
);

router.patch(
  "/:publicId",
  requireAuth(tokenSigner),
  validateRequest(updateMissionRequestSchema),
  updateController.handle
);

router.post(
  "/:publicId/join",
  requireAuth(tokenSigner),
  joinController.handle
);

router.post(
  "/:publicId/leave",
  requireAuth(tokenSigner),
  leaveController.handle
);

router.post(
  "/:publicId/cancel",
  requireAuth(tokenSigner),
  cancelController.handle
);

router.post(
  "/:publicId/coverage",
  requireAuth(tokenSigner),
  postCoverageController.handle
);

router.get(
  "/:publicId/coverage",
  requireAuth(tokenSigner),
  getCoverageController.handle
);

export const missionRoute = router;