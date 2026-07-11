export interface MissionUpdateOutput {
    publicId: string;
    comment: string;
    photoUrl: string | null;
    status: string;
    createdAt: string;
    user: {
        publicId: string;
        username: string;
        photoUrl: string | null;
    };
    pointValue?: {
        points: number;
        label: string;
    } | null;
}

export interface CreateMissionUpdateDTO {
    missionPublicId: string;
    comment: string;
    photoUrl?: string;
    imageBuffer?: Buffer;
}

export interface CreateMissionUpdateResponse {
    updateId: number;
    publicId: string;
}