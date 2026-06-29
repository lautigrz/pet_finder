import z from "zod";

export const createConversationSchema = z.object({
    body: z.object({
        publicTargetId: z.string().uuid()
    })
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const getConversationSchema = z.object({
    params: z.object({
        publicConversationId: z.string().uuid()
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional()
});

export type GetConversationInput = z.infer<typeof getConversationSchema>;
