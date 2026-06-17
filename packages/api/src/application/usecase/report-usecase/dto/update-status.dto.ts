import { ReportStatus } from "@domain/report/types/report.status";

export interface UpdateStatusDTO {
    publicId: string;
    status: ReportStatus;
}