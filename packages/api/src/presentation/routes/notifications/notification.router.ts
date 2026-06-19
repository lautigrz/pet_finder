import { Router } from "express";
import { NotificationController } from "../../controller/NotificationController";
import { RegisterDeviceTokenUseCase } from "../../../application/usecase/register-device-token/register-device-token.usecase";
import { RemoveDeviceTokenUseCase } from "../../../application/usecase/remove-device-token/remove-device-token.usecase";
import { PrismaDeviceTokenRepository } from "../../../infrastructure/repository/PrismaDeviceTokenRepository";
import { JwtTokenSigner } from "../../../infrastructure/security/JwtTokenSigner";
import { readAuthConfig } from "../../config/authConfig";
import { requireAuth } from "../../middleware/requireAuth.middleware";
import { validateRequest } from "../../middleware/validate.request";
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from "../../schemas/notifications/device-token.schema";

const router = Router();

const deviceTokenRepository = new PrismaDeviceTokenRepository();
const registerDeviceTokenUseCase = new RegisterDeviceTokenUseCase(deviceTokenRepository);
const removeDeviceTokenUseCase = new RemoveDeviceTokenUseCase(deviceTokenRepository);

const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);

const notificationController = new NotificationController(
  registerDeviceTokenUseCase,
  removeDeviceTokenUseCase,
);

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
