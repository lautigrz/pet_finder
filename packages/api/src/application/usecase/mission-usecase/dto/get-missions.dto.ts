export interface GetMissionDTO {
  missionId: number;
  publicId: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;

  report: {
    publicId: string;
    type: string;
    description: string | null;

    petName: string | null;
    image: string | null;

    username: string;
    photoUrl: string | null;
  };
}