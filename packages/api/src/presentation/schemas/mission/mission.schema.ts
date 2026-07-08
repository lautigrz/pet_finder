import z from "zod";

export const createMissionBodySchema = z.object({
  reportPublicId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().int().positive(),
  title: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
});

export const createMissionRequestSchema = z.object({
  body: createMissionBodySchema,
});

export const createMissionUpdateBodySchema = z.object({
  missionPublicId: z.string().uuid(),
  comment: z.string().min(1).max(1000),
  photoUrl: z.string().nullable().optional(),
});

export const createMissionUpdateRequestSchema = z.object({
  body: createMissionUpdateBodySchema,
});

export type CreateMissionInput = z.infer<typeof createMissionBodySchema>;
export type CreateMissionUpdateInput = z.infer<typeof createMissionUpdateBodySchema>;

export const updateMissionBodySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().int().positive(),
  title: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
});

export const updateMissionRequestSchema = z.object({
  body: updateMissionBodySchema,
});

export type UpdateMissionInput = z.infer<typeof updateMissionBodySchema>;

