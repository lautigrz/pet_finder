
export interface VolunteerOutput {
  publicId: string;
  username: string;
  photoUrl: string | null;
}

export interface SearchAreaOutput {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface LocationOutput {
  address: string | null;
  latitude: number;
  longitude: number;
}

export interface PetDetailsOutput {
  name: string;
  photoUrl: string | null;
  gender: string;
  size: string;
}

export interface MissionReportOutput {
  publicId: string;
  description: string;
  location: LocationOutput;
  photoUrl: string | null;
  title: string | null;
  type: string;
  status: string;
  petDetails?: PetDetailsOutput;
}

export interface MissionOutput {
  publicId: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  searchArea: SearchAreaOutput;
  report: MissionReportOutput;
  volunteers: VolunteerOutput[];
}

export interface MissionCardReportOutput {
  publicId: string;
  location: LocationOutput;
  photoUrl: string | null;
  title: string | null;
  status: string;
  petDetails?: PetDetailsOutput;
}

export interface MissionCardOutput {
  publicId: string;
  status: string;
  createdAt: Date;
  searchArea: SearchAreaOutput;
  report: MissionCardReportOutput;
}