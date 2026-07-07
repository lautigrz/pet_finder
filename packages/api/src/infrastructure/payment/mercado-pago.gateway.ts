import { createHmac, timingSafeEqual } from "crypto";
import { MercadoPagoConfig, Preference, Payment as MpPayment } from "mercadopago";
import { logger } from "@pet-alert/shared";
import {
    CreatePreferenceInput,
    CreatePreferenceResult,
    PaymentDetails,
    PaymentGateway,
    WebhookSignatureParams,
} from "@domain/payment/gateway/payment-gateway";

export class MercadoPagoGateway implements PaymentGateway {
    private readonly client: MercadoPagoConfig;

    constructor(
        accessToken: string,
        private readonly webhookSecret: string,
    ) {
        this.client = new MercadoPagoConfig({ accessToken });
    }

    async createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
        const preference = new Preference(this.client);

        const notificationUrl = input.notificationUrl.startsWith("https://")
            ? input.notificationUrl
            : undefined;

        try {
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: input.externalReference,
                            title: input.title,
                            quantity: input.quantity,
                            unit_price: input.unitPrice,
                            currency_id: input.currency,
                        },
                    ],
                    external_reference: input.externalReference,
                    back_urls: {
                        success: input.backUrls.success,
                        failure: input.backUrls.failure,
                        pending: input.backUrls.pending,
                    },
                    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
                },
            });

            if (!result.id || !result.init_point) {
                throw new Error("Mercado Pago did not return a valid preference");
            }

            return {
                preferenceId: String(result.id),
                initPoint: result.init_point,
            };
        } catch (error) {
            const detail = JSON.stringify(error, Object.getOwnPropertyNames(error as object));
            logger.error(`Mercado Pago preference creation failed: ${detail}`);
            throw error;
        }
    }

    async getPayment(mpPaymentId: string): Promise<PaymentDetails> {
        const payment = new MpPayment(this.client);

        const result = await payment.get({ id: mpPaymentId });

        return {
            mpPaymentId: String(result.id),
            status: result.status ?? "unknown",
            externalReference: result.external_reference ?? null,
            approvedAt: result.date_approved ? new Date(result.date_approved) : null,
        };
    }

    verifySignature(params: WebhookSignatureParams): boolean {
        if (!params.xSignature || !params.xRequestId) return false;

        let ts: string | undefined;
        let hash: string | undefined;

        for (const part of params.xSignature.split(",")) {
            const [key, value] = part.split("=").map((s) => s.trim());
            if (key === "ts") ts = value;
            if (key === "v1") hash = value;
        }

        if (!ts || !hash) return false;

        const manifest = `id:${params.dataId.toLowerCase()};request-id:${params.xRequestId};ts:${ts};`;
        const computed = createHmac("sha256", this.webhookSecret).update(manifest).digest("hex");

        const computedBuffer = Buffer.from(computed);
        const hashBuffer = Buffer.from(hash);

        return computedBuffer.length === hashBuffer.length && timingSafeEqual(computedBuffer, hashBuffer);
    }
}
