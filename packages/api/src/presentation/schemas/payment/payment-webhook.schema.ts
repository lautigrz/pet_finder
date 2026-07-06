import { z } from "zod";

export const paymentWebhookSchema = z.object({
    query: z.object({
        type: z.string().optional(),
        topic: z.string().optional(),
        id: z.string().optional(),
        "data.id": z.string().optional(),
    }).passthrough(),
    body: z.object({
        type: z.string().optional(),
        action: z.string().optional(),
        data: z.object({
            id: z.union([z.string(), z.number()]).transform(String),
        }).optional(),
    }).passthrough(),
});

export type PaymentWebhookQuery = z.infer<typeof paymentWebhookSchema>["query"];
export type PaymentWebhookBody = z.infer<typeof paymentWebhookSchema>["body"];
