import { z } from 'zod';

const EMAIL_MAX_LENGTH = 255;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;

export const createUserRequestSchema = z.object({
    body: z.object({
        email: z.string().max(EMAIL_MAX_LENGTH).refine(value => value.trim().length > 0),
        username: z.string().max(USERNAME_MAX_LENGTH).refine(value => value.trim().length > 0),
        password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    }),
});

export const verifyEmailRequestSchema = z.object({
    body: z.object({
        token: z.string().min(1),
    }),
});

export const updateProfileRequestSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        lastname: z.string().optional(),
        username: z.string().optional(),
        photoUrl: z.string().optional(),
    }).refine(
        (data) => Object.values(data).some(v => v !== undefined),
        { message: 'At least one field is required' },
    ),
});

export const updateNotificationPreferencesRequestSchema = z.object({
    body: z.object({
        notificationRadius: z.number().int().min(1).max(100).optional(),
        lostReportsEnabled: z.boolean().optional(),
        sightingReportsEnabled: z.boolean().optional(),
        matchesEnabled: z.boolean().optional(),
        mutedUntil: z.string().datetime().nullable().optional(),
    }).refine(
        (data) => Object.values(data).some(v => v !== undefined),
        { message: 'At least one preference is required' },
    ),
});

export const createUserReviewRequestSchema = z.object({
    body: z.object({
        rating: z.number().int().min(1).max(5),
        description: z.string().max(1000).optional().nullable(),
    }),
});

export const listUserReviewsRequestSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        pageSize: z.coerce.number().int().min(1).max(50).optional(),
    }),
});

export type CreateUserBody = z.infer<typeof createUserRequestSchema>['body'];
export type VerifyEmailBody = z.infer<typeof verifyEmailRequestSchema>['body'];
export type UpdateProfileBody = z.infer<typeof updateProfileRequestSchema>['body'];
export type UpdateNotificationPreferencesBody = z.infer<typeof updateNotificationPreferencesRequestSchema>['body'];
export type CreateUserReviewBody = z.infer<typeof createUserReviewRequestSchema>['body'];
