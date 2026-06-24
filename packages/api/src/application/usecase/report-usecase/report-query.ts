import { isValidReportType, ReportType } from "@domain/report/types/report.type";
import { AnimalType, isValidAnimalType } from "@domain/shared/animal-type/animal-type";
import { isValidReportStatus, ReportStatus } from "@domain/report/types/report.status";
import { GetFilteredReportsDTO } from "./dto/get-filtered-reports.dto";



export class ReportQuery {
    readonly reportType?: ReportType;
    readonly animalType?: AnimalType;
    readonly status?: ReportStatus;
    readonly createdFrom?: Date;
    readonly createdTo?: Date;
    readonly userPublicId?: string;
    readonly q?: string;

    constructor(dto: GetFilteredReportsDTO) {

        if (dto.reportType && !isValidReportType(dto.reportType)) {
            throw new Error(`ReportType inválido: ${dto.reportType}`);
        }
        if (dto.animalType && !isValidAnimalType(dto.animalType)) {
            throw new Error(`AnimalType inválido: ${dto.animalType}`);
        }
        if (dto.status && !isValidReportStatus(dto.status)) {
            throw new Error(`ReportStatus inválido: ${dto.status}`);
        }

        this.reportType = dto.reportType as ReportType | undefined;
        this.animalType = dto.animalType as AnimalType | undefined;
        this.status = dto.status as ReportStatus | undefined;
        this.createdFrom = dto.createdFrom ? new Date(`${dto.createdFrom}T00:00:00.000-03:00`) : undefined;
        this.createdTo = dto.createdTo ? new Date(`${dto.createdTo}T23:59:59.999-03:00`) : undefined;
        this.userPublicId = dto.userPublicId;
        const normalizedQuery = dto.q?.trim();
        this.q = normalizedQuery || undefined;
    }

    get requiresPetJoin(): boolean {
        return !!this.animalType;
    }

}