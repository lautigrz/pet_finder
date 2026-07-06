import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createFeaturedPreferenceSchema } from "src/presentation/schemas/payment/create-featured-preference.schema";
import { paymentWebhookSchema } from "src/presentation/schemas/payment/payment-webhook.schema";
import { CreateFeaturedPreferenceController } from "@presentation/controller/payment/create-featured-preference.controller";
import { PaymentWebhookController } from "@presentation/controller/payment/payment-webhook.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createFeaturedPreference = container.resolve(CreateFeaturedPreferenceController);
const paymentWebhook = container.resolve(PaymentWebhookController);

router.post("/featured/:publicId", requireAuth(tokenSigner), validateRequest(createFeaturedPreferenceSchema), createFeaturedPreference.handle);
router.post("/webhook", validateRequest(paymentWebhookSchema), paymentWebhook.handle);

export const paymentRoute = router;
