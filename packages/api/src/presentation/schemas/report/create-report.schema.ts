import { isValidReportType, ReportType } from '@domain/report/types/report.type';
import { isValidAnimalType } from '@domain/shared/animal-type/animal-type';
import { isValidGenderType } from '@domain/shared/gender-type/gender.type';
import { isValidSizeType } from '@domain/shared/size-type/size.type';

import { z } from 'zod';

export const createReportSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(ReportType.LOST),
        petId: z.string(),
        occurredAt: z.coerce.date(),
        location: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number()
        }),
        description: z.string()
    }),
    z.object({
        type: z.literal(ReportType.SIGHTING),
        petName: z.string().optional(),
        animalType: z.string().transform(val => val.toUpperCase()).refine(val => isValidAnimalType(val)),
        genderType: z.string().optional().transform(val => val?.toUpperCase()).refine(val => !val || isValidGenderType(val)),
        sizeType: z.string().optional().transform(val => val?.toUpperCase()).refine(val => !val || isValidSizeType(val)),
        breed: z.string().optional(),
        hasIdCollar: z.boolean(),
        color: z.string(),
        isInTransit: z.boolean().default(false),
        occurredAt: z.coerce.date(),
        location: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number()
        }),
        description: z.string()
    })
])

export const createReportRequestSchema = z.object({
    body: createReportSchema,
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});


export type CreateReportInput = z.infer<typeof createReportSchema>
