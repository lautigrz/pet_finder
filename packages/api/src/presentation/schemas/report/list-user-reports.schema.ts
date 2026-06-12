import { z } from 'zod';
import { isValidReportType } from '@domain/report/types/report.type';
import { isValidAnimalType } from '@domain/shared/animal-type/animal-type';

export const listUserReportsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        reportType: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidReportType(val), { message: 'ReportType inválido' })
            .optional(),
        animalType: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidAnimalType(val), { message: 'AnimalType inválido' })
            .optional(),
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
        radiusKm: z.coerce.number().positive().optional(),
        createdFrom: z.string().date().optional(),
        createdTo: z.string().date().optional(),
    })
});

export type ListUserReportsQuery = z.infer<typeof listUserReportsSchema>['query'];
