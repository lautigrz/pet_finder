import { z } from 'zod';

const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;

const email = z.string().max(EMAIL_MAX_LENGTH).refine(value => value.trim().length > 0);
const refreshToken = z.string().min(1);

export const loginRequestSchema = z.object({
    body: z.object({
        email,
        password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    }),
});

export const logoutRequestSchema = z.object({
    body: z.object({ refreshToken }),
});

export const refreshRequestSchema = z.object({
    body: z.object({ refreshToken }),
});

export const forgotPasswordRequestSchema = z.object({
    body: z.object({ email }),
});

export const resetPasswordRequestSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    }),
});

export const googleLoginRequestSchema = z.object({
    body: z.object({ code: z.string().min(1) }),
});

export type LoginBody = z.infer<typeof loginRequestSchema>['body'];
export type LogoutBody = z.infer<typeof logoutRequestSchema>['body'];
export type RefreshBody = z.infer<typeof refreshRequestSchema>['body'];
export type ForgotPasswordBody = z.infer<typeof forgotPasswordRequestSchema>['body'];
export type ResetPasswordBody = z.infer<typeof resetPasswordRequestSchema>['body'];
export type GoogleLoginBody = z.infer<typeof googleLoginRequestSchema>['body'];
