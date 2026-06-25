import { Router } from "express";
import { container } from "tsyringe";
import { NotificationController } from "../../controller/NotificationController";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { requireAuth } from "../../middleware/requireAuth.middleware";
import { validateRequest } from "../../middleware/validate.request";
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from "../../schemas/notifications/device-token.schema";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const notificationController = container.resolve(NotificationController);

router.post(
  "/tokens",
  requireAuth(tokenSigner),
  validateRequest(registerDeviceTokenSchema),
  notificationController.registerToken,
);
router.delete(
  "/tokens",
  requireAuth(tokenSigner),
  validateRequest(removeDeviceTokenSchema),
  notificationController.removeToken,
);

export default router;
