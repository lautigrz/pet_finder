import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from "@presentation/schemas/notifications/device-token.schema";
import { RegisterDeviceTokenController } from "@presentation/controller/notification/register-device-token.controller";
import { RemoveDeviceTokenController } from "@presentation/controller/notification/remove-device-token.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const registerDeviceToken = container.resolve(RegisterDeviceTokenController);
const removeDeviceToken = container.resolve(RemoveDeviceTokenController);

router.post("/tokens", requireAuth(tokenSigner), validateRequest(registerDeviceTokenSchema), registerDeviceToken.handle);
router.delete("/tokens", requireAuth(tokenSigner), validateRequest(removeDeviceTokenSchema), removeDeviceToken.handle);

export default router;
