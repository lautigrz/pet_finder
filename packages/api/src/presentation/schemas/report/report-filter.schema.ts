import { z } from 'zod';
import { isValidReportType } from '@domain/report/types/report.type';
import { isValidReportStatus } from '@domain/report/types/report.status';
import { isValidAnimalType } from '@domain/shared/animal-type/animal-type';

export const getFilteredReportsSchema = z.object({
    query: z.object({
        reportType: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidReportType(val), { message: 'ReportType inválido' })
            .optional(),
        animalType: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidAnimalType(val), { message: 'AnimalType inválido' })
            .optional(),
        status: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidReportStatus(val), { message: 'ReportStatus inválido' })
            .optional(),
        createdFrom: z.string().date().optional(),
        createdTo: z.string().date().optional(),
        userPublicId: z.string().optional(),
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
        radiusKm: z.coerce.number().positive().optional(),
        sort: z.enum(['recent']).optional(),
        q: z.string().trim().min(2,{message: 'La busqueda debe tener al menos 2 caracteres'}).max(100,{message: 'La busqueda no puede superar los 100 caracteres'}).optional(),
    })
});

export type GetFilteredReportsDTO = z.infer<typeof getFilteredReportsSchema>['query'];