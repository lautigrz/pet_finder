import { z } from 'zod';
import { isValidAppealStatus } from '@domain/appeal/types/appeal-status';

export const createAppealSchema = z.object({
    token: z.string().min(1),
    message: z.string().trim().min(1).max(1000),
});

export const createAppealRequestSchema = z.object({
    body: createAppealSchema,
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});

export const appealQueueSchema = z.object({
    body: z.object({}).optional(),
    query: z.object({
        status: z.string().transform(val => val.toUpperCase()).refine(val => isValidAppealStatus(val)).optional(),
    }),
    params: z.object({}).optional(),
});

export const resolveAppealSchema = z.object({
    accept: z.boolean(),
});

export const resolveAppealRequestSchema = z.object({
    body: resolveAppealSchema,
    query: z.object({}).optional(),
    params: z.object({ publicId: z.string().uuid() }),
});

export type CreateAppealBody = z.infer<typeof createAppealSchema>;
export type AppealQueueQuery = z.infer<typeof appealQueueSchema>['query'];
export type ResolveAppealBody = z.infer<typeof resolveAppealSchema>;
