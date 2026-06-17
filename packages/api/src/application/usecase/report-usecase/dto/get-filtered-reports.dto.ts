export interface GetFilteredReportsDTO {
    reportType?: string;
    animalType?: string;
    status?: string;
    createdFrom?: string;
    createdTo?: string;
    userPublicId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    sort?: string;
    q?: string;
}