import z from "zod";

export const sendMessageSchema = z.object({
    body: z.object({
        conversationId: z.string().uuid(),
        content: z.string().trim().max(1000).optional(),
        images: z.array(
            z.object({
                publicId: z.string(),
                url: z.string().url()
            })
        ).default([])
    })
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;