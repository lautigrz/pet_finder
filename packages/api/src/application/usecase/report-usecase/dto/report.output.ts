
export interface SightingReportOutput {
    petName?: string;
    animalType: string;
    genderType?: string;
    sizeType?: string;
    hasIdCollar: boolean;
    isInTransit: boolean;
    color: string;
    images: { url: string }[];
}


export interface LostReportOutput {
    publicId: string;
    name: string;
    animalType: string;
    genderType: string;
    sizeType: string;
    color: string;
    hasIdCollar: boolean;
    breed: string;
    images: { url: string }[];

}


export interface ReportOutput {
    publicId: string;
    user: {
        publicId: string;
        username: string;
        photoUrl: string;
        createdAt?: Date;
    };
    type: string;
    status: string;
    description: string;
    location: {
        address: string;
        latitude: number;
        longitude: number;
    };
    details: SightingReportOutput | LostReportOutput;
    occurredAt: Date;
    createdAt: Date;
    updatedAt: Date | null;
}
