import { z } from "zod";

export const createFeaturedPreferenceSchema = z.object({
    params: z.object({
        publicId: z.string().uuid(),
    }),
});

export type CreateFeaturedPreferenceParams = z.infer<typeof createFeaturedPreferenceSchema>["params"];
