import { Router } from "express";
import { container } from "tsyringe";

import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { GetMissionResponsesController } from "@presentation/controller/mission-response/get-mission-responses.controller";

import { CreateMissionResponseController } from "@presentation/controller/mission-response/create-mission-response.controller";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const controller = container.resolve(CreateMissionResponseController);
const getController = container.resolve(
  GetMissionResponsesController
);

router.get(
  "/:publicId",
  requireAuth(tokenSigner),
  getController.handle
);

router.post(
  "/",
  requireAuth(tokenSigner),
  controller.handle
);

export const missionResponseRoute = router;