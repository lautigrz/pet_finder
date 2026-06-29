export interface MatchResultDetailDTO {
    publicId: string;
    sourceReportPublicId: string;
    score: number;
    imageScore: number;
    descriptionScore: number;
    details: DetailsReportDTO;
}



export interface DetailsReportDTO {
    publicId: string;
    images: string[];
    animalType: string;
}