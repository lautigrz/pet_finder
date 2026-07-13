import { z } from "zod";
import { isValidReportStatus } from "@domain/report/types/report.status";

export const updateStatusReportSchema = z.object({
    params: z.object({
        publicId: z.string().uuid(),
    }),
    body: z.object({
        status: z.string()
            .transform(val => val.toUpperCase())
            .refine(val => isValidReportStatus(val), { message: 'ReportStatus inválido' }),
        resolved: z.boolean().optional(),
        resolvedAt: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida' })
            .transform((val) => new Date(`${val}T12:00:00`))
            .optional(),
    })
})

export type UpdateStatusReportInput = z.infer<typeof updateStatusReportSchema>['body'];