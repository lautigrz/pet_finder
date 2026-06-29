export interface ReportImageEntity {
  imageId: number;
  photoUrl: string;
  embeddingPhoto: number[] | null;
}

export interface ReportEntity {
  reportId: number;
  publicId: string;
  reportTypeId: number;
  reportStatusId: number;
  details: DetailsReport
  description: string | null;
  location: LocationReport;
  embeddingDescription: number[] | null;
  images: ReportImageEntity[];
}


export interface DetailsReport {
  animalType?: string,
  breed?: string,
  size?: string,
  gender?: string,
  color?: string,
  hasIdIdentification: boolean,
}

export interface LocationReport {
  locationLat: number;
  locationLng: number;
}

