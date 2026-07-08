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
}

export interface CreateMissionUpdateDTO {
    missionPublicId: string;
    comment: string;
    photoUrl?: string;
}

export interface CreateMissionUpdateResponse {
    updateId: number;
    publicId: string;
}