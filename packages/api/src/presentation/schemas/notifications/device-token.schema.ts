import { z } from 'zod';

const DEVICE_TOKEN_MAX_LENGTH = 512;

export const registerDeviceTokenSchema = z.object({
    body: z.object({
        token: z.string().min(1).max(DEVICE_TOKEN_MAX_LENGTH),
    }),
});

export const removeDeviceTokenSchema = z.object({
    body: z.object({
        token: z.string().min(1).max(DEVICE_TOKEN_MAX_LENGTH),
    }),
});

export type RegisterDeviceTokenBody = z.infer<typeof registerDeviceTokenSchema>['body'];
export type RemoveDeviceTokenBody = z.infer<typeof removeDeviceTokenSchema>['body'];
