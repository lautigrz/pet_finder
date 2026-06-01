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
    })
});

export type GetFilteredReportsDTO = z.infer<typeof getFilteredReportsSchema>['query'];