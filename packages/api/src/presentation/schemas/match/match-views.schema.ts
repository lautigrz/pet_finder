import { z } from "zod";

export const markMatchSeenSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    matchPublicId: z.string().uuid(),
  }),
});

export type MarkMatchSeenParams = z.infer<typeof markMatchSeenSchema>["params"];
