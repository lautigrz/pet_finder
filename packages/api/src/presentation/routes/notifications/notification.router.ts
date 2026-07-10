import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from "@presentation/schemas/notifications/device-token.schema";
import { RegisterDeviceTokenController } from "@presentation/controller/notification/register-device-token.controller";
import { RemoveDeviceTokenController } from "@presentation/controller/notification/remove-device-token.controller";
import { GetLostNearbyNotificationsController } from "@presentation/controller/notification/get-lost-nearby-notifications.controller";
import { MarkLostNearbyNotificationSeenController } from "@presentation/controller/notification/mark-lost-nearby-notification-seen.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const registerDeviceToken = container.resolve(RegisterDeviceTokenController);
const removeDeviceToken = container.resolve(RemoveDeviceTokenController);
const getLostNearbyNotifications = container.resolve(GetLostNearbyNotificationsController);
const markLostNearbyNotificationSeen = container.resolve(MarkLostNearbyNotificationSeenController);

router.post("/tokens", requireAuth(tokenSigner), validateRequest(registerDeviceTokenSchema), registerDeviceToken.handle);
router.delete("/tokens", requireAuth(tokenSigner), validateRequest(removeDeviceTokenSchema), removeDeviceToken.handle);
router.get("/lost-nearby", requireAuth(tokenSigner), getLostNearbyNotifications.handle,);
router.patch("/lost-nearby/:notificationPublicId/seen", requireAuth(tokenSigner), markLostNearbyNotificationSeen.handle,);

export default router;
