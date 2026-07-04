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
    })
})

export type UpdateStatusReportInput = z.infer<typeof updateStatusReportSchema>['body'];