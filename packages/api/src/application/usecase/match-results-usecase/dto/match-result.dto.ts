export interface MatchResultDetailDTO {
    publicId: string;
    sourceReportPublicId: string;
    score: number;
    details: DetailsReportDTO;
}



export interface DetailsReportDTO {
    publicId: string;
    images: string[];
    animalType: string;
}