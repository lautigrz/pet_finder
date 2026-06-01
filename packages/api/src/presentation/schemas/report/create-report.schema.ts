import { ReportType } from '@domain/report/types/report.type';
import { AnimalType } from '@domain/shared/animal-type/animal-type';

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
        animalType: z.nativeEnum(AnimalType),
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

export type CreateReportInput = z.infer<typeof createReportSchema>
