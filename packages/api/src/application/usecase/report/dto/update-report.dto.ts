export interface UpdateSightingReportDetailsDTO {
  petName?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: 'MALE' | 'FEMALE' | null;
  sizeType?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  breed?: string | null;
  hasIdCollar?: boolean;
  color?: string;
  isInTransit?: boolean;
}

export interface UpdateLostReportDetailsDTO {
  petPublicId: string;
  name?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: 'MALE' | 'FEMALE' | null;
  sizeType?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  breed?: string | null;
  color?: string;
  hasIdCollar?: boolean;
}

export interface UpdateReportDTO {
  publicId: string;
  description?: string;
  occurredAt?: Date;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  sightingDetails?: UpdateSightingReportDetailsDTO;
  lostDetails?: UpdateLostReportDetailsDTO;
  keepImageIds?: string[];
  newImages?: Buffer[];
}export interface UpdateSightingReportDetailsDTO {
  petName?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: 'MALE' | 'FEMALE' | null;
  sizeType?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  breed?: string | null;
  hasIdCollar?: boolean;
  color?: string;
}

export interface UpdateLostReportDetailsDTO {
  petPublicId: string;
  name?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: 'MALE' | 'FEMALE' | null;
  sizeType?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  breed?: string | null;
  color?: string;
  hasIdCollar?: boolean;
}

export interface UpdateReportDTO {
  publicId: string;
  description?: string;
  occurredAt?: Date;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  sightingDetails?: UpdateSightingReportDetailsDTO;
  lostDetails?: UpdateLostReportDetailsDTO;
  keepImageIds?: string[];
  newImages?: Buffer[];
}
