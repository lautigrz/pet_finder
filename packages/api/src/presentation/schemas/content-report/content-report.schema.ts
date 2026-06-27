import { z } from 'zod';
import { isValidContentReportTargetType } from '@domain/content-report/types/content-report-target-type';
import { isValidContentReportReason } from '@domain/content-report/types/content-report-reason';
import { isValidContentReportStatus } from '@domain/content-report/types/content-report-status';

export const createContentReportSchema = z.object({
    targetType: z.string().transform(val => val.toUpperCase()).refine(val => isValidContentReportTargetType(val)),
    targetPublicId: z.string().uuid(),
    reason: z.string().transform(val => val.toUpperCase()).refine(val => isValidContentReportReason(val)),
    description: z.string().max(500).optional(),
});

export const createContentReportRequestSchema = z.object({
    body: createContentReportSchema,
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});

export const contentReportQueueSchema = z.object({
    body: z.object({}).optional(),
    query: z.object({
        status: z.string().transform(val => val.toUpperCase()).refine(val => isValidContentReportStatus(val)).optional(),
    }),
    params: z.object({}).optional(),
});

export type CreateContentReportInput = z.infer<typeof createContentReportSchema>;
export type ContentReportQueueQuery = z.infer<typeof contentReportQueueSchema>['query'];
