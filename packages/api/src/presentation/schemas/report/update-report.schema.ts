import { z } from 'zod';
export const updateReportSchema = z.object({
  params: z.object({
    publicId: z.string().uuid(),
  }),
  body: z.object({
    description: z.string().optional(),
    occurredAt: z.coerce.date().optional(),
    location: z.object({
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    sightingDetails: z.object({
      petName: z.string().nullable().optional(),
      animalType: z.enum(['DOG', 'CAT']).optional(),
      genderType: z.enum(['MALE', 'FEMALE']).nullable().optional(),
      sizeType: z.enum(['SMALL', 'MEDIUM', 'LARGE']).nullable().optional(),
      breed: z.string().nullable().optional(),
      hasIdCollar: z.boolean().optional(),
      color: z.string().optional(),
    }).optional(),
    lostDetails: z.object({
      petPublicId: z.string().uuid(),
      name: z.string().nullable().optional(),
      animalType: z.enum(['DOG', 'CAT']).optional(),
      genderType: z.enum(['MALE', 'FEMALE']).nullable().optional(),
      sizeType: z.enum(['SMALL', 'MEDIUM', 'LARGE']).nullable().optional(),
      breed: z.string().nullable().optional(),
      color: z.string().optional(),
      hasIdCollar: z.boolean().optional(),
    }).optional(),
    keepImageIds: z.preprocess(
      (val) => typeof val === 'string' ? JSON.parse(val) : val,
      z.array(z.string()).optional()
    ),
  }),
});


export type UpdateReportInput = z.infer<typeof updateReportSchema>['body'];