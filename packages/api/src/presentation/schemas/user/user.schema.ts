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

export type CreateUserBody = z.infer<typeof createUserRequestSchema>['body'];
export type VerifyEmailBody = z.infer<typeof verifyEmailRequestSchema>['body'];
